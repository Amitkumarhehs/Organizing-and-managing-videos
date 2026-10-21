# 🎓 Learn With Amit & Gautam

A modern, responsive online learning platform designed to organize video lessons and provide students with a simple, user-friendly learning experience.

🔗 **Live Website:** [Open Website](https://amitkumarhehs.github.io/Organizing-and-managing-videos/)

## ✨ Features

- 🎨 **Modern UI:** Clean design with a responsive layout and smooth animations.
- 📚 **Course Management:** Organized course cards and video lessons.
- 🎥 **Video Player:** Watch lessons directly on the website.
- ⏭️ **Lesson Navigation:** Move between previous and next lessons.
- 📊 **Learning Progress:** Track completed lessons and learning progress.
- 🌙 **Dark Mode:** Switch between light and dark themes.
- 🔐 **Login & Registration:** Authentication interface with form validation.
- 👤 **Student Dashboard:** View learning progress and recently watched lessons.
- 🛡️ **Admin Dashboard:** Planned support for viewing and managing registered students after secure backend configuration.
- 📱 **Responsive Design:** Works on desktop, tablet, and mobile devices.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- GitHub Pages
- Firebase Authentication and Cloud Firestore (planned/configuration required for real accounts and student records)

## 📂 Project Structure

```text
Organizing-and-managing-videos/
│
├── index.html       # Main website
├── style.css        # Website styling and responsive design
├── script.js        # Website interactions and lesson logic
├── README.md        # Project documentation
└── videos/          # Local video files, if used
```

Additional files, such as `admin.html` and Firebase configuration modules, may be added as the project develops.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Amitkumarhehs/Organizing-and-managing-videos.git
```

### 2. Open the Project

Open the downloaded folder in Visual Studio Code.

### 3. Run the Website

Open `index.html` in a browser or use the Live Server extension in VS Code.

### 4. Configure Videos

Add your lesson video files to the `videos/` directory, or configure direct video URLs from a suitable video-hosting service.

Ensure that the video paths in the HTML or JavaScript match the actual file locations.

## 🔥 Firebase Setup

Firebase can be integrated to provide real student accounts and centrally stored student records.

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a web application.
3. Enable Email/Password authentication.
4. Create a Cloud Firestore database.
5. Configure the Firebase web SDK in the project.
6. Set restrictive Firestore Security Rules.
7. Assign administrator permissions through a trusted, secure process.

**Important:** The login interface or demo authentication alone does not create real online student accounts. Real registration and admin features require Firebase configuration and testing.

Never store passwords in localStorage or expose private service-account credentials in frontend code.

## 🌐 Deployment

This project can be hosted using GitHub Pages.

1. Push the project files to the GitHub repository.
2. Open **Settings → Pages**.
3. Select the appropriate deployment branch and folder.
4. Save the settings and wait for deployment.
5. Open the published website and test its functionality.

Live URL:

https://amitkumarhehs.github.io/Organizing-and-managing-videos/

## 🔮 Future Improvements

- Secure student authentication
- Admin dashboard with student management
- Course enrollment
- Student progress synchronization across devices
- Search and filter functionality
- Course thumbnails and lesson durations
- Secure access controls for premium lessons

## 🤝 Contributing

Suggestions and improvements are welcome. Fork the repository, make your changes, and submit a pull request.

## 📄 License

No license has been specified yet. Please contact the repository owner before reusing or redistributing this project's code.

---

**Developed as a learning project to explore web development and online course management.**
