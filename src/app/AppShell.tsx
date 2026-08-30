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
      <div id="app-shell-content" className="shell-frame">
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <header className="app-header utility-strip">
          <p>평균 균형 조정실</p>
          <span className="app-header-context">오늘의 실험</span>
          <Link to="/">처음으로</Link>
        </header>
        <main id="main-content" className="sheet-main" tabIndex={-1}>
          <Outlet />
        </main>
        <div className="shell-tools">
          <details className="app-settings">
            <summary>설정</summary>
            <StoragePreference
              mode={state.saveMode}
              onChange={(mode) => dispatch({ type: 'SET_SAVE_MODE', mode })}
              onClear={clearProgress}
            />
          </details>
        </div>
        <footer className="shell-footer">
          <p>가상 자료로 평균의 뜻과 한계를 살펴봅니다.</p>
          <p className="footer-boundary">이름이나 실제 자료를 입력하지 않는 안전한 학습 활동입니다.</p>
        </footer>
      </div>
      <UpdateHistoryDialog />
    </>
  );
};

export default AppShell;
