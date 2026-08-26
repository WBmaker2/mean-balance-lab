import { Link, Outlet, useNavigate } from 'react-router-dom';
import { StoragePreference } from '../components/settings/StoragePreference';
import { UpdateHistoryDialog } from '../components/update/UpdateHistoryDialog';
import { useLabSession } from '../state/LabSessionContext';

export const AppShell = () => {
  const { state, dispatch } = useLabSession();
  const navigate = useNavigate();

  const clearProgress = () => {
    // Let the mission route unmount before RESET_ALL so its bootstrap effect
    // cannot interpret the cleared state as a request to start a new run.
    navigate('/');
    window.setTimeout(() => dispatch({ type: 'RESET_ALL' }), 0);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <div id="app-shell-content">
        <header>
          <p>평균 균형 조정실</p>
          <Link to="/">처음으로</Link>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <details className="app-settings">
          <summary>설정</summary>
          <StoragePreference
            mode={state.saveMode}
            onChange={(mode) => dispatch({ type: 'SET_SAVE_MODE', mode })}
            onClear={clearProgress}
          />
        </details>
        <footer>가상 자료로 평균의 뜻과 한계를 살펴봅니다.</footer>
      </div>
      <UpdateHistoryDialog />
    </>
  );
};

export default AppShell;
