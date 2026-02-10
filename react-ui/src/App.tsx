import { Outlet } from "react-router-dom";
import { Header } from "./components/common";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <Outlet />
    </div>
  );
}

export default App;
