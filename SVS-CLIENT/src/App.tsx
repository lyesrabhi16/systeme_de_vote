import { Route, Routes } from 'react-router';
import LoginPage from '@/pages/LoginPage';
import { routes } from '@/services/routing';
function App() {
  return (
    <>
      <Routes>
        <Route path={routes.HOME} element={<>Home Page</>} />
        <Route path={routes.LOGIN} element={<LoginPage />} />
        <Route path={routes.NOT_FOUND} element={<>Not Found</>} />
      </Routes>
    </>
  );
}

export default App;
