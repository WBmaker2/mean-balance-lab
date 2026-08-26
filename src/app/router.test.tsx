import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderAppAt } from '../test/fixtures';

describe('learning router', () => {
  it('redirects an unverified deep link to the first allowed stage', async () => {
    renderAppAt('#/mission/mean-twins/twins-4-a/compare');

    expect(await screen.findByRole('heading', { name: '평균을 먼저 예측해 볼까요?' })).toBeVisible();
    expect(window.location.hash).toContain('/predict');
  });

  it('recovers from an unknown mission and shows the start message', async () => {
    renderAppAt('#/mission/not-a-mission/twins-4-a/predict');

    expect(await screen.findByText('자료를 찾지 못해 시작 화면으로 돌아왔어요.')).toBeVisible();
    expect(window.location.hash).toBe('#/');
  });
});
