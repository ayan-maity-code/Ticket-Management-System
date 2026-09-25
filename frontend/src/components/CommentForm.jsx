import { useState } from 'react';

export default function CommentForm({ onSubmit, loading, fieldError }) {
  const [text, setText] = useState('');
  const [clientError, setClientError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setClientError('');
    if (!text.trim()) {
      setClientError('Comment text is required.');
      return;
    }
    try {
      await onSubmit(text.trim());
      setText('');
    } catch {
      /* parent surfaces error */
    }
  }

  const errorMessage = clientError || (typeof fieldError === 'string' ? fieldError : fieldError?.message);

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <label className="sr-only" htmlFor="comment-text">Comment</label>
      <textarea
        id="comment-text"
        className="field-control"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        placeholder="Write an update…"
        aria-invalid={Boolean(errorMessage)}
      />
      <button
        type="submit"
        className={`btn btn-primary btn-sm${loading ? ' btn-loading' : ''}`}
        disabled={loading}
      >
        {loading ? 'Posting…' : 'Post comment'}
      </button>
    </form>
  );
}
