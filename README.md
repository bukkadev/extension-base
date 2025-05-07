# Twitch Extension Base Template

A starter template for building Twitch extensions, providing the basic structure and setup needed to begin development.

## Features

- Basic project structure
- Development environment setup
- Common extension components
- Configuration samples

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Twitch Developer Account

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/bukkadev/extension-base.git
   cd extension-base
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure your extension:
   - Copy `.env_example` to `.env`
   - Update with your Twitch extension credentials

4. Start the development server:
   ```bash
   npm start
   ```


## Configuration

### Dev Panel Password Protection

Set `DEV_PANEL_USERNAME` and `DEV_PANEL_PASSWORD` in your `.env` file to enable password protection for the dev panel.


## Paths

- `/admin` - The dev panel
- `/video_overlay.html` - The extension video overlay

Details about configuring your extension can be found in the [Twitch Developer Documentation](https://dev.twitch.tv/docs/extensions/).


