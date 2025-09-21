# SpaceTracker Pro 🛰️

A modern, real-time International Space Station tracking application with 3D visualization, orbital mechanics, and advanced space data analytics.

## ✨ Features

### 🛰️ Real-time ISS Tracking
- Live ISS position updates every 3 seconds
- 3D globe visualization using WorldWind.js
- Real-time orbit path rendering
- ISS model with accurate positioning

### 🌍 Advanced Visualization
- Multiple map projections (3D, Mercator, Polar, etc.)
- Layer management system
- Customizable base maps and overlays
- Atmospheric and star field rendering

### 📊 Data Analytics
- Distance calculations to user location
- Elevation and bearing calculations
- Visibility predictions
- Orbital mechanics calculations

### 🔮 Prediction Tools
- Time-based position prediction
- Location-based pass finding
- Pass duration and elevation calculations
- Multi-day pass forecasting

### 👨‍🚀 Crew Information
- Current crew members aboard ISS
- Spacecraft assignments
- Mission information
- Real-time crew updates

### 🎥 Live Streaming
- Integrated ISS live video feed
- Full-screen viewing
- Stream controls and quality settings

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection for API data
- Node.js 14+ (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/spacetracker-pro/space-tracker-pro.git
   cd space-tracker-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Production Build

```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Frontend Structure
```
├── index.html                 # Main HTML file
├── styles/
│   └── main.css              # Modern CSS with design system
├── scripts/
│   ├── main.js               # Application entry point
│   ├── space-globe.js        # 3D globe controller
│   ├── layer-controller.js   # Layer management
│   ├── settings-controller.js # Settings management
│   ├── search-controller.js  # Location search
│   ├── iss-data-manager.js   # ISS data handling
│   ├── prediction-manager.js # Prediction tools
│   └── stream-manager.js     # Live streaming
└── src/
    ├── components/           # React components
    ├── hooks/               # Custom React hooks
    ├── services/            # API and calculation services
    ├── types/               # TypeScript type definitions
    └── utils/               # Utility functions
```

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: WorldWind.js, Three.js
- **UI Framework**: React 19, TypeScript
- **Styling**: Modern CSS with design system
- **APIs**: ISS Position API, OpenStreetMap, BigDataCloud
- **Build Tools**: Rollup, PostCSS, ESLint

## 🔧 Configuration

### API Keys
Some features require API keys for enhanced functionality:

1. **Bing Maps** (optional)
   - Get key from [Bing Maps Portal](https://www.bingmapsportal.com/)
   - Set in `scripts/main.js`:
   ```javascript
   const BING_API_KEY = "your-key-here";
   ```

2. **MapQuest** (optional)
   - Get key from [MapQuest Developer](https://developer.mapquest.com/)
   - Set in `scripts/main.js`:
   ```javascript
   const MAPQUEST_API_KEY = "your-key-here";
   ```

### Customization
- **Themes**: Modify CSS variables in `styles/main.css`
- **Update Intervals**: Adjust in `scripts/iss-data-manager.js`
- **API Endpoints**: Configure in `src/services/space-api.ts`

## 📱 Usage

### Basic Navigation
- **Globe Interaction**: Mouse drag to rotate, scroll to zoom
- **Layer Controls**: Click "Layers" to toggle map layers
- **Settings**: Click "Settings" to configure display options
- **ISS Data**: Click "ISS Data" to show/hide position panel

### Prediction Tools
1. Click "Predict" button
2. Choose prediction type:
   - **Time → Position**: Enter date/time to predict ISS location
   - **Location → Passes**: Enter location to find ISS passes

### Live Streaming
1. Click "Live" button
2. Watch real-time ISS video feed
3. Use full-screen mode for immersive experience

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start development server
npm run dev        # Start with CORS enabled
npm run build      # Build for production
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run type-check # TypeScript type checking
npm run clean      # Clean build directory
```

### Code Style
- ESLint configuration included
- TypeScript strict mode enabled
- Modern JavaScript (ES6+) features
- React functional components with hooks

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 🌐 API Integration

### ISS Position API
- **Endpoint**: `https://api.wheretheiss.at/v1/satellites/25544`
- **Update Frequency**: Every 3 seconds
- **Data**: Latitude, longitude, altitude, velocity, timestamp

### Geocoding Services
- **Primary**: BigDataCloud Reverse Geocoding
- **Fallback**: OpenStreetMap Nominatim
- **Features**: Location search, reverse geocoding, suggestions

### Crew Data API
- **Endpoint**: `http://api.open-notify.org/astros.json`
- **Update Frequency**: Every 5 minutes
- **Data**: Current crew members, spacecraft assignments

## 🎨 Design System

### Color Palette
- **Space Black**: `#0a0a0f` - Primary background
- **Electric Cyan**: `#00d4ff` - Accent color
- **Neon Green**: `#00ff88` - Success states
- **Cosmic White**: `#f8fafc` - Primary text

### Typography
- **Display Font**: Orbitron (for headers)
- **Body Font**: Exo 2 (for content)
- **Mono Font**: JetBrains Mono (for data)

### Components
- Glassmorphism design language
- Responsive grid system
- Modern button styles
- Interactive data panels

## 📊 Performance

### Optimization Features
- Lazy loading of 3D models
- Efficient layer management
- Cached API responses
- Optimized rendering pipeline

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security

### Data Privacy
- No personal data collection
- Client-side geolocation only
- Secure API communications
- No tracking or analytics

### API Security
- HTTPS-only API calls
- Request rate limiting
- Error handling and fallbacks
- Input validation

## 🐛 Troubleshooting

### Common Issues

**Globe not loading**
- Check browser WebGL support
- Try Chrome or Firefox
- Disable browser extensions

**ISS data not updating**
- Check internet connection
- Verify API endpoints are accessible
- Check browser console for errors

**Location not working**
- Enable browser geolocation
- Check HTTPS requirement
- Verify location permissions

### Debug Mode
Enable debug mode in settings to see:
- Performance metrics
- API request logs
- Error details
- Layer information

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/spacetracker-pro/space-tracker-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/spacetracker-pro/space-tracker-pro/discussions)
- **Email**: contact@spacetracker.pro

## 🙏 Acknowledgments

- **NASA** for ISS data and imagery
- **WorldWind.js** for 3D globe technology
- **OpenStreetMap** for geocoding services
- **React** and **Three.js** communities
- **Space enthusiasts** worldwide

---

**SpaceTracker Pro** - Bringing the International Space Station to your screen in real-time! 🚀✨
