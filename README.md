# 🖼️ PixelMuse

<p align="center">
  <img src="./assets/icon.png" alt="PixelMuse" width="200">
</p>

<p align="center">
  <b>A sleek Electron desktop app for generating stunning images with multiple AI models</b>
</p>

<hr>

## ✨ Features

- 🎨 Generate incredible images with OpenAI and Stability AI models
- 📏 Multiple image size options to fit your needs
- 💾 Easily save and organize your generated masterpieces
- 🔒 Secure local API key storage
- 🌙 Elegant dark-themed UI experience
- 🪟 Custom titlebar and window controls for a native feel

## 🚀 Requirements

- Node.js 18+ and npm
- OpenAI API key for OpenAI models
- Stability AI API key for Stability models

## 💻 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/TheRealPerson98/PixelMuse.git
cd pixelmuse
npm install
```

## 🔧 Development

To run the application in development mode:

```bash
npm run dev
```

This will start both the Next.js development server and the Electron application.

## 🏗️ Building

### Local Building

To build the application for production locally:

```bash
npm run dist
```

This will generate distributables in the `dist` folder.

### GitHub Automated Builds

This project uses GitHub Actions to automatically build and release the application for multiple platforms:
- Windows (x64 and ARM64)
- Linux (x64 and ARM64)
- macOS

To create a new release:

1. Push your changes to the `main` branch
2. Create a tag with the pattern `v*` (e.g., `v1.0.1`)
3. Push the tag to GitHub: `git push origin v1.0.1`
4. GitHub Actions will automatically build the app for all platforms and create a release with installable files

## 🔄 Auto-Updates

PixelMuse includes an automatic update system that:

- Checks for updates when the app starts and periodically while running
- Downloads updates automatically in the background
- Notifies users when updates are ready to install
- Provides a one-click option to install updates and restart

When releasing a new version:
1. Update the version number in `package.json`
2. Push changes to the main branch
3. Create and push a new tag with the new version
4. GitHub Actions will build the release and the app will automatically detect and download the update

## 🔑 API Key Storage

The application uses a custom storage solution to securely save your OpenAI API key to your local machine. The key is stored in the app's user data directory in a JSON file:

- Windows: `%APPDATA%\pixelmuse\settings.json`
- macOS: `~/Library/Application Support/pixelmuse/settings.json`
- Linux: `~/.config/pixelmuse/settings.json`

Your API key is only sent to OpenAI's servers for image generation requests and is never shared with anyone else.

## 🤝 Contributing

Please feel free to add your own models and make a pull request! We welcome contributions that expand the app's capabilities.

For development workflow:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request to the main branch
5. Once approved and merged, your changes will be included in the next release

## 📄 License

Apache-2.0 
