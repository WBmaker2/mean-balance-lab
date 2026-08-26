interface FeedbackPromptProps {
  message: string;
  nextAction: string;
}

export const FeedbackPrompt = ({ message, nextAction }: FeedbackPromptProps) => (
  <aside role="alert" aria-live="assertive">
    <p>{message}</p>
    <p>다음 행동: {nextAction}</p>
  </aside>
);
