# Tringle Player

A modern, feature-rich video hosting and embedding platform built with Node.js and Express.

![Tringle Player](tringle-player/logo.png)

## Features

- 🎥 Video Upload & Hosting
  - Support for MP4, WebM, and OGG formats
  - Large file uploads (up to 2GB)
  - Video replacement functionality
  - Quota management (25 videos per user)

- 🎮 Advanced Video Player
  - Custom HTML5 video player
  - Playback speed control
  - Picture-in-Picture support
  - Quality selection
  - Loop functionality
  - Keyboard shortcuts
  - Dark/Light theme support

- 🔒 User Management
  - Secure user authentication
  - Personal video dashboard
  - Theme preferences
  - Video management

- 🎯 Embedding
  - Responsive iframe embedding
  - Copy-to-clipboard functionality
  - Preview before embedding

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Frontend**: EJS, TailwindCSS
- **Authentication**: bcryptjs, express-session
- **File Handling**: Multer

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Akar1881/Tringle-player.git
cd tringle-player
```

2. Install dependencies:
```bash
npm install
```

3. Configure the application:
   - Copy `config.example.json` to `config.json`
   - Update the configuration values as needed:
```json
{
    "port": 10061,
    "uploadPath": "./uploads",
    "database": "./users.db",
    "sessionSecret": "your-secret-key",
    "maxFileSize": 2147483648,
    "maxVideosPerUser": 25,
    "allowedFileTypes": [
        "video/mp4",
        "video/webm",
        "video/ogg"
    ],
    "embedDomain": "http://your-domain:10061",
    "logoPath": "/tringle-player/logo.png",
    "smallLogoPath": "/tringle-player/small-logo.png"
}
```

4. Create required directories:
```bash
mkdir uploads
```

5. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Usage

1. Register an account at `http://localhost:10061/register`
2. Log in to access your dashboard
3. Upload videos (supported formats: MP4, WebM, OGG)
4. Manage your videos:
   - View uploaded videos
   - Replace videos
   - Delete videos
   - Copy embed codes
   - Preview in the built-in player

### Embedding Videos

To embed a video on your website, copy the embed code from your dashboard and paste it into your HTML:

```html
<iframe src="http://your-domain:10061/embed/video-id" width="640" height="360" frameborder="0" allowfullscreen></iframe>
```

### Keyboard Shortcuts

The video player supports the following keyboard shortcuts:

- `Space` or `K`: Play/Pause
- `F`: Toggle fullscreen
- `M`: Mute/Unmute
- `←`: Rewind 5 seconds
- `→`: Forward 5 seconds
- `↑`: Volume up
- `↓`: Volume down

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| port | Server port | 10061 |
| uploadPath | Path for video storage | ./uploads |
| database | SQLite database path | ./users.db |
| maxFileSize | Maximum video file size | 2GB |
| maxVideosPerUser | Video quota per user | 25 |
| allowedFileTypes | Supported video formats | mp4, webm, ogg |
| embedDomain | Domain for embed URLs | http://localhost:10061 |

## Security Features

- Password hashing using bcrypt
- Session-based authentication
- File type validation
- Size restrictions
- User quotas
- Secure video serving

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Font Awesome for icons
- TailwindCSS for styling
- Express.js community
- Node.js community