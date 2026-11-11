import { Navigate, Route, Routes } from "react-router-dom";
import { TabBar, TopBar } from "./components/ui.jsx";
import { GymDataProvider } from "./GymData.jsx";
import ExerciseProgressScreen from "./screens/ExerciseProgressScreen.jsx";
import ExercisesScreen from "./screens/ExercisesScreen.jsx";
import MesosScreen from "./screens/MesosScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";
import SessionScreen from "./screens/SessionScreen.jsx";
import TemplatesScreen from "./screens/TemplatesScreen.jsx";
import WorkoutScreen from "./screens/WorkoutScreen.jsx";
import "./gym.css";

function GymShell() {
  return (
    <div className="gym">
      <div className="gym-shell">
        <TopBar />
        <main className="gym-main">
          <Routes>
            <Route index element={<WorkoutScreen />} />
            <Route path="mesos" element={<MesosScreen />} />
            <Route path="history/:workoutId" element={<SessionScreen />} />
            <Route path="templates" element={<TemplatesScreen />} />
            <Route path="exercises" element={<ExercisesScreen />} />
            <Route path="exercises/:exerciseId" element={<ExerciseProgressScreen />} />
            <Route path="more" element={<MoreScreen />} />
            <Route path="*" element={<Navigate to="/gym" replace />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </div>
  );
}

export default function GymApp() {
  return (
    <GymDataProvider>
      <GymShell />
    </GymDataProvider>
  );
}
