import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type PropsWithChildren } from 'react';
import { createInitialSession, sessionReducer, type LabAction, type LabSessionState } from '../domain/session';
import {
  DEVICE_STORAGE_KEY, TAB_STORAGE_KEY, loadSession, saveSession, type WebStorageLike,
} from './persistence';

export interface LabSessionContextValue {
  state: LabSessionState;
  dispatch: Dispatch<LabAction>;
}

const LabSessionContext = createContext<LabSessionContextValue | null>(null);

const browserStorage = (name: 'sessionStorage' | 'localStorage'): WebStorageLike | null => {
  try {
    const storage = globalThis[name];
    return storage && typeof storage.getItem === 'function' ? storage : null;
  } catch {
    return null;
  }
};

const safeRemove = (storage: WebStorageLike | null, key: string): void => {
  try {
    storage?.removeItem(key);
  } catch {
    // A blocked or full storage must not interrupt the in-memory session.
  }
};

const loadInitialState = (): LabSessionState => {
  const tabStorage = browserStorage('sessionStorage');
  const deviceStorage = browserStorage('localStorage');
  const tabState = tabStorage ? loadSession(tabStorage, TAB_STORAGE_KEY) : null;
  if (tabState) return tabState;
  const deviceState = deviceStorage ? loadSession(deviceStorage, DEVICE_STORAGE_KEY) : null;
  return deviceState?.saveMode === 'device' ? deviceState : createInitialSession();
};

export interface LabSessionProviderProps extends PropsWithChildren {
  initialState?: LabSessionState;
}

export const LabSessionProvider = ({ children, initialState }: LabSessionProviderProps) => {
  const [state, reduce] = useReducer(sessionReducer, initialState, (provided) => provided ?? loadInitialState());
  const previousMode = useRef(state.saveMode);
  const skipNextPersist = useRef(false);

  const dispatch = useCallback((action: LabAction) => {
    if (action.type === 'RESET_ALL') {
      skipNextPersist.current = true;
      safeRemove(browserStorage('sessionStorage'), TAB_STORAGE_KEY);
      safeRemove(browserStorage('localStorage'), DEVICE_STORAGE_KEY);
    }
    if (action.type === 'SET_SAVE_MODE' && action.mode === 'tab') {
      safeRemove(browserStorage('localStorage'), DEVICE_STORAGE_KEY);
    }
    reduce(action);
  }, []);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      previousMode.current = state.saveMode;
      return;
    }
    const tabStorage = browserStorage('sessionStorage');
    const deviceStorage = browserStorage('localStorage');
    if (previousMode.current === 'device' && state.saveMode === 'tab') {
      safeRemove(deviceStorage, DEVICE_STORAGE_KEY);
    }
    if (state.saveMode === 'device') {
      if (deviceStorage) saveSession(deviceStorage, DEVICE_STORAGE_KEY, state);
    } else if (tabStorage) {
      saveSession(tabStorage, TAB_STORAGE_KEY, state);
    }
    previousMode.current = state.saveMode;
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <LabSessionContext.Provider value={value}>{children}</LabSessionContext.Provider>;
};

export const useLabSession = (): LabSessionContextValue => {
  const context = useContext(LabSessionContext);
  if (!context) throw new Error('useLabSession must be used inside LabSessionProvider');
  return context;
};
