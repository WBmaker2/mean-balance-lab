import type { SaveMode } from '../../domain/types';

export interface StoragePreferenceProps {
  mode: SaveMode;
  onChange: (mode: SaveMode) => void;
  onClear: () => void;
}

const CLEAR_CONFIRMATION = '저장된 미션 근거와 수정 기록을 이 기기에서 지울까요?';

export const StoragePreference = ({ mode, onChange, onClear }: StoragePreferenceProps) => {
  const isDeviceMode = mode === 'device';
  const clearProgress = () => {
    if (window.confirm(CLEAR_CONFIRMATION)) onClear();
  };

  return (
    <section className="storage-preference" aria-labelledby="storage-preference-heading">
      <h2 id="storage-preference-heading">진행 저장</h2>
      <label>
        <input
          type="checkbox"
          checked={isDeviceMode}
          onChange={(event) => onChange(event.currentTarget.checked ? 'device' : 'tab')}
        />
        이 기기에 진행 저장
      </label>
      <p>
        {isDeviceMode
          ? '응답은 이 기기에만 남으며 공유되거나 동기화되지 않습니다.'
          : '기본 진행은 이 탭에만 남고 탭을 닫으면 사라집니다.'}
      </p>
      <button type="button" onClick={clearProgress}>모든 진행 지우기</button>
    </section>
  );
};

