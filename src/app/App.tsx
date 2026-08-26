import { HashRouter } from 'react-router-dom';
import { LabSessionProvider, type LabSessionProviderProps } from '../state/LabSessionContext';
import { AppRoutes } from './router';

export const App = ({ initialState }: Pick<LabSessionProviderProps, 'initialState'> = {}) => (
  <LabSessionProvider {...(initialState ? { initialState } : {})}>
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  </LabSessionProvider>
);

export default App;
