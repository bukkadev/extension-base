const jwt = require('jsonwebtoken');
const rpn = require('request-promise-native');
// const console = require('consoleton');
const {promisify} = require('util');

// Promisified goodies
const verifyAsync = promisify(jwt.verify);
const signAsync = promisify(jwt.sign);


if (!process.env.EXTENSION_SECRET_KEY ||
    !process.env.DEVELOPER_USER_ID ||
    //!process.env.EXTENSION_VERSION ||
    //!process.env.EXTENSION_CONFIG_STRING ||
    //!process.env.EBS_SECRET ||
    //!process.env.OAUTH_REDIRECT_URI ||
    !process.env.EXTENSION_CLIENT_ID) {
    throw Error("Missing environment variables! Read the docs!");
}

// JWT needs the secret as a buffer
const BINARY_SECRET = Buffer.from(process.env.EXTENSION_SECRET_KEY, 'base64');

// Our export object
let twitch = {};

// Create JWT's to go with requests
async function createServerJWT (channel) {
    // 60min expiry
    let timeNow = new Date();
    timeNow.setMinutes(timeNow.getMinutes() + 60);

    // Create and sign JWT. Role must be 'external'
    let rawJWT = {
        exp: Math.floor(timeNow/1000),
        user_id: process.env.DEVELOPER_USER_ID, // the account that owns the extension
        channel_id: channel,
        role: 'external',
        pubsub_perms: {
            send: ["*"]
        }
    }

    return await signAsync(rawJWT, BINARY_SECRET);
}


// Twitch PubSub messaging
twitch.sendPubSub = async function (channel, target, contentType, message) {
    try {
        let devJWT = await createServerJWT(channel);

        // Target has to be a list. Turn strings into one element lists
        if (typeof target == 'string') {
            target = [target];
        }

        await rpn.post({
            url: "https://api.twitch.tv/helix/extensions/pubsub",
            headers: {
                "Client-ID": process.env.EXTENSION_CLIENT_ID,
                "Authorization": "Bearer " + devJWT
            },
            json: {
                message: message,
                broadcaster_id : channel,
                target: target
            }
        });
    } catch (e) {
        console.error("Failed to send Twitch PubSub message: " + e);
        throw {
            status: 500,
            msg: "Failed to send PubSub message"
        }
    }
}

// Send a chat message via the extension interface
twitch.sendChatMessage = async function (channelID, message) {
    try {
        let devJWT = await createServerJWT(channelID);

        await rpn.post({
            url: `https://api.twitch.tv/extensions/${process.env.EXTENSION_CLIENT_ID}/${process.env.EXTENSION_VERSION}/channels/${channelID}/chat`,
            headers: {
                "Client-ID": process.env.EXTENSION_CLIENT_ID,
                "Authorization": "Bearer " + devJWT
            },
            json: {
                text: message
            }
        });

    } catch (e) {
        console.error("Failed to send message to chat!");
        console.error(e);
        // No throw
    }
}

// For external functions to verify JWT's
twitch.verifyJWT = async function (token) {
    // console.log("---- VERIFYING TOKEN ---");
    try {
        return await verifyAsync(token, BINARY_SECRET);
    } catch (e) {
        console.debug("Failed to verify JWT: " + e);
        throw {
            status: 400,
            msg: "Failed to verify Twitch JWT"
        };
    }
}


twitch.verifyToken = function(req, res, next) {
    // console.log("---- VERIFYING TOKEN ---");
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, BINARY_SECRET, (err, user) => {
        // console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

// Sets the channel required config to the correct value
twitch.approveChannel = async function (channelID) {
    await twitch.setChannelConfigString(channelID, process.env.EXTENSION_CONFIG_STRING);
}

// Available for developer testing and/or disabling channels
twitch.setChannelConfigString = async function (channelID, configString) {
    try {
        let devJWT = await createServerJWT(channelID);
        let safeURL = encodeURI("https://api.twitch.tv/extensions/" + process.env.EXTENSION_CLIENT_ID + "/" + process.env.EXTENSION_VERSION + "/required_configuration?channel_id=" + channelID);

        await rpn.put({
            url: safeURL,
            headers: {
                "Client-Id": process.env.EXTENSION_CLIENT_ID,
                "Authorization": "Bearer " + devJWT
            },
            json: {
                required_configuration: configString
            }
        });
    } catch (e) {
        console.error("Failed to set required channel config string for channel " + channelID + ": " + e);
        throw {
            status: 500,
            msg: "Internal server error"
        }
    }
}

// For processing Twitch OAuth callbacks. Returns the verification data and tokens
twitch.getOAuthTokens = async function (code) {
    try {
        // Ask for tokens
        let tokenUrl = `https://id.twitch.tv/oauth2/token`;

        // Remember this needs to use the other type of secret
        let formData = {
            client_id: process.env.EXTENSION_CLIENT_ID,
            client_secret: process.env.EBS_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: process.env.OAUTH_REDIRECT_URI
        };

        // Get the tokens
        let res = await rpn.post({
            url:tokenUrl,
            form: formData
        });
        let tokens = JSON.parse(res)

        // Verify it
        let verificationInfo = await rpn.get({
            url: "https://id.twitch.tv/oauth2/validate",
            headers: {
                Authorization: "OAuth " + tokens.access_token
            },
            json: true
        });
        verificationInfo.tokens = tokens;

        return verificationInfo;
    } catch (e) {
        console.error("Failed to process and verify Twitch OAuth callback: " + e);
        throw {
            status: 500,
            msg: "Internal server error"
        }
    }
}

// For refreshing Twitch user OAuth tokens
twitch.refreshAccessToken = async function (refresh_token) {
    try {
        // Remember this needs to use the other type of secret
        let formData = {
            client_id: process.env.EXTENSION_CLIENT_ID,
            client_secret: process.env.EBS_SECRET,
            grant_type: "refresh_token",
            refresh_token: refresh_token
        };

        let res = await rpn.post({
            url: "https://id.twitch.tv/oauth2/token",
            form: formData
        });
        let tokens = JSON.parse(res);

        return tokens;

    } catch (e) {
        console.error("Failed to refresh Twitch OAuth token");
        console.error(e);
        throw {
            status: 500,
            msg: "Internal Sever Error"
        };
    }
}

// For getting a user's email address, requires the user's ID and OAuth access token
twitch.getUserInfo = async function (userID, access_token) {
    try {
        return await rpn.get({
            url: `https://api.twitch.tv/helix/users?id=${userID}`,
            headers: {
                Authorization: "Bearer " + access_token
            },
            json: true
        });
    } catch (e) {
        console.error("Failed to get user info for " + userID + " Twitch: " + e);
        throw {
            status: 500,
            msg: "Internal server error"
        }
    }
}

// Recursive helper. Note: may 404 for extensions in test phase
// Recursive helper. Note: may 404 for extensions in test phase
async function loopChannels (cursor) {
    // let baseUrl = `https://api.twitch.tv/extensions/${process.env.EXTENSION_CLIENT_ID}/live_activated_channels`;

    let baseUrl = `https://api.twitch.tv/helix/extensions/live?extension_id=${process.env.EXTENSION_CLIENT_ID}&first=100`
    if (cursor) {
        baseUrl += "&after=" + cursor;
    }

    let parsedList = [];
    let newCursor = null;

    try {

        let body = await rpn.get({
            url: baseUrl,
            json: true,
            headers: {
                "Client-Id": process.env.EXTENSION_CLIENT_ID,
                "Authorization": "Bearer " + process.env.TWITCH_APP_ACCESS_TOKEN
            }
        });


        // Remapping to keep old channel object structure 
        for (var i = 0; i < body.data.length; i++) {
            let channel = body.data[i]
            parsedList.push({
                "game": channel.game_name,
                "id": channel.broadcaster_id,
                "title": channel.title,
                "username": channel.broadcaster_name,
                "view_count": 0,
            })
        }
        // parsedList = body.data;
        newCursor = body.pagination;
    } catch (e) {
        console.error("Failed to query twitch for live channels!");
        // console.error(e);
        // console.log(e);
        if (e.statusCode == 404) {
            console.log("SENDING BACK test data");
            parsedList = [
                {
                  "game": "Dota 2",
                  "id": "39754760",
                  "title": "TESTING",
                  "username": "bukka_",
                  "view_count": "2",
                }
            ]
        }else{
            throw({
                status: 500,
                msg: "Something went wrong"
            });
        }
    }

    if (newCursor) {
        let remainingChannels = await loopChannels(newCursor);
        parsedList = parsedList.concat(remainingChannels);
    }

    return parsedList;
}

// For gettign the full list of currently live channels
twitch.getLiveChannels = async function () {
    return await loopChannels();
}



module.exports = twitch;