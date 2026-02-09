# Mental Health Assistance Web App

Welcome to the Mental Health Assistance Web App! This application provides users with mental health support by analyzing user-inputted problems and offering personalized relaxation suggestions using Gemini AI.

## Features
- **User Authentication:** Firebase authentication with Google login and email/password sign-up.
- **Personalized Dashboard:** Displays user data and mental health suggestions.
- **AI Integration:** Uses Gemini AI to analyze problems and provide tailored advice.
- **User-Friendly UI:** A soothing interface designed for mental well-being.

## Project Structure
```
├── index.html        # Landing page
├── home.html          # User dashboard
├── profile.html       # User profile page
├── register.html      # Registration and login page
├── script.js          # Main JavaScript logic
├── styles.css         # Styling with a soothing design
└── image.png          # Project logo or other assets
```

## Setup Instructions
Follow these steps to run the application locally:

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/mental-health-assistance-app.git
    cd mental-health-assistance-app
    ```

2. **Install Dependencies:**
    Ensure you have Node.js and npm installed, then run:
    ```bash
    npm install
    ```

3. **Configure Firebase:**
    - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
    - Enable authentication (Google and email/password).
    - Create Firestore Database for storing user data.
    - Get your API keys and add them to a `.env` file.

4. **Run the App:**
    ```bash
    npm start
    ```

## Usage 
- Visit: https://rithvik0906.github.io/Mental-Health-Assistance/
- Register using your email or Google account.
- Log in to access the personalized dashboard.
- Submit your mental health concerns to receive AI-based relaxation tips.
- View past suggestions on your profile page.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.

---
Feel free to report any issues or suggest improvements via the [Issues tab](https://github.com/your-username/mental-health-assistance-app/issues).
