import { Link, Outlet } from 'react-router-dom';
import { StoragePreference } from '../components/settings/StoragePreference';
import { useLabSession } from '../state/LabSessionContext';

export const AppShell = () => {
  const { state, dispatch } = useLabSession();

  return (
    <>
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
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
          onClear={() => dispatch({ type: 'RESET_ALL' })}
        />
      </details>
      <footer>가상 자료로 평균의 뜻과 한계를 살펴봅니다.</footer>
    </>
  );
};

export default AppShell;
