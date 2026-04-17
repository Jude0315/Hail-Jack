# Hail Jack – Titanic Survival Quiz Game

Hail Jack is an interactive full-stack web game inspired by the Titanic survival scenario. Players answer quiz questions to keep Jack balanced on a plank. Correct answers help him survive, while wrong answers push him toward the sea.

---

## Features

- User Authentication (Login and Signup with session management)
- Interactive Quiz Game with real-time balance mechanics
- Leaderboard system (player rankings and match sessions)
- Frame-based sprite animations
- Audio and UI interaction effects
- External trivia API integration
- Game logic including streaks, scoring, and win/lose states

---

## Tech Stack

### Frontend
- React (Vite)
- CSS (custom animations and UI)
- Axios (API communication)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- express-session and connect-mongo (session handling)
- bcrypt (password hashing)

---

## System Architecture

- The frontend communicates with the backend using REST APIs
- The backend handles:
  - Authentication (session-based)
  - Game logic
  - Leaderboard storage
- An external Trivia API is used to fetch quiz questions

---

## Key Concepts Implemented

### Version Control
- The project was managed using Git
- Development was done incrementally (authentication, game logic, leaderboard, UI)

### Event-Driven Programming
- React state management using useState and useEffect
- Animation loops using requestAnimationFrame
- User interactions such as clicks, inputs, and navigation events

### Interoperability
- Communication between frontend and backend using HTTP requests (Axios)
- Integration with external Trivia API
- JSON used as the data exchange format

### Virtual Identity
- Users can register and log in
- Session-based authentication is implemented
- Each player has:
  - A unique identity
  - Stored game results
  - Leaderboard tracking

---

## How the Game Works

1. The player logs in or signs up
2. Quiz questions are fetched from an external API
3. Each answer affects the balance meter:
   - Correct answer increases the meter
   - Wrong answer decreases the meter
4. The game ends when:
   - The meter reaches the top (win)
   - The meter reaches the bottom (lose)
5. The result is saved to the leaderboard

---

## Scoring System

The final score is calculated based on:
- Win or lose result
- Number of correct answers
- Best streak achieved
- Final balance meter value

---

## Project Structure

Hail-Jack/
├─ backend/
│  ├─ index.js
│  └─ models/
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ game/
│  │  └─ assets/

---

## AI Usage Acknowledgement

Parts of this project were developed with assistance from ChatGPT (OpenAI).

- Used for:
  - Debugging
  - Code suggestions
  - Logic structuring

All generated code was reviewed, understood, modified, and integrated into the project by the author.

---

## How to Run the Project

### Backend

cd backend
npm install
npm run dev


### Frontend

cd frontend
npm install
npm run dev


---

## Notes

- This is an academic project
- Built as part of coursework submission
- Focused on demonstrating system integration, event-driven design, and user identity handling

---

## Author

Developed by: [Kinoshan ketheeswaran] [UOB ID:2541697]