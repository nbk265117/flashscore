# Flashinio Score - Football Match Analysis

A modern web application for analyzing football matches with AI-powered insights.

## 🌟 Features

- **Real-time Match Data** - Live football match information
- **AI Analysis** - ChatGPT-powered match analysis
- **Comparison Tools** - Compare predictions with actual results
- **Authentication System** - Secure access with user/admin roles
- **Responsive Design** - Works on all devices
- **Modern UI** - Beautiful glassmorphism design

## 🔐 Authentication

- **User Code**: `0000` (Regular user access)
- **Admin Code**: `1991` (Full access including admin features)

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run server

# Open in browser
http://localhost:3000/viewer.html
```

### Deploy to GitHub Pages

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Save

3. **Your site will be available at**:
   `https://yourusername.github.io/your-repo-name/`

## 📁 Project Structure

```
Zbet/
├── public/           # Static files (HTML, CSS, JS)
│   ├── viewer.html   # Main match viewer
│   ├── analysis.html # AI analysis page
│   ├── comparison.html # Comparison tools
│   └── auth.html     # Authentication page
├── src/              # Source code
├── data/             # Match data and analysis
├── scripts/          # Utility scripts
└── .github/          # GitHub Actions workflow
```

## 🛠️ Technologies

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Data**: JSON files
- **AI**: ChatGPT API integration
- **Deployment**: GitHub Pages, GitHub Actions

## 🎨 Design Features

- **Glassmorphism UI** - Modern glass-like effects
- **Responsive Design** - Mobile-first approach
- **Smooth Animations** - CSS transitions and transforms
- **Gradient Backgrounds** - Beautiful color schemes
- **Hover Effects** - Interactive elements

## 📱 Mobile Responsive

The application is fully responsive and works perfectly on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers

## 🔧 Configuration

### Environment Variables
Create a `.env` file for local development:
```env
PORT=3000
NODE_ENV=development
```

## 📊 Features by User Type

### Regular User (Code: 0000)
- ✅ View matches
- ✅ Basic analysis
- ✅ Responsive design

### Admin User (Code: 1991)
- ✅ All regular features
- ✅ Refresh analysis
- ✅ Run comparisons
- ✅ Full access to all tools

## 🚀 Deployment Status

[![Deploy to GitHub Pages](https://github.com/yourusername/your-repo-name/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://yourusername.github.io/your-repo-name/)

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Made with ❤️ for football analysis** 