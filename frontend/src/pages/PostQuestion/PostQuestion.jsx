// Import React's useState Hook for managing component state
import { useState } from "react";

// Import useNavigate so we can redirect the user after posting
import { useNavigate } from "react-router-dom";

// Import the question API functions
import {
  createQuestion,
  generateQuestionDraftCoach,
} from "../../services/question.service";

// Import the CSS module for styling this page
import styles from "./PostQuestion.module.css";

export default function PostQuestion() {
  // Used to navigate to another page after successfully posting
  const navigate = useNavigate();

  // Stores the title and content entered by the user
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // Tracks whether the question is currently being submitted
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracks whether the AI Draft Coach is processing the question
  const [isCoaching, setIsCoaching] = useState(false);

  // Stores the feedback returned by the AI Draft Coach
  const [coachFeedback, setCoachFeedback] = useState(null);

  // Stores error messages shown to the user
  const [error, setError] = useState("");

  // Stores success messages shown to the user
  const [success, setSuccess] = useState("");

  // Handles changes to the title and content inputs
  const handleChange = (event) => {
    // Get the input's name and current value
    const { name, value } = event.target;

    // Update only the field that the user changed
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    // Clear old messages when the user starts typing again
    setError("");
    setSuccess("");
  };

  // Validates the question before it is submitted
  const validateForm = () => {
    // Remove unnecessary spaces before checking the length
    const title = formData.title.trim();
    const content = formData.content.trim();

    // Title must contain at least 5 characters
    if (title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return false;
    }

    // Content must contain at least 10 characters
    if (content.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return false;
    }

    return true;
  };

  // Sends the question draft to the AI Draft Coach
  const handleGetFeedback = async () => {
    // Clear previous messages and feedback
    setError("");
    setSuccess("");
    setCoachFeedback(null);

    // Remove unnecessary spaces
    const title = formData.title.trim();
    const content = formData.content.trim();

    // If a title was entered, it must be at least 5 characters
    if (title.length > 0 && title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }

    // Question content must contain at least 10 characters
    if (content.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return;
    }

    try {
      // Disable the AI button while the request is processing
      setIsCoaching(true);

      // Send the question draft to the backend AI Draft Coach
      const response = await generateQuestionDraftCoach({
        title,
        content,
      });

      // Store the AI response so it can be displayed
      setCoachFeedback(response.data);
    } catch (err) {
      // Try to display the error message returned by the backend
      const message =
        err.response?.data?.message ||
        "Unable to get AI feedback. Please try again.";

      setError(message);
    } finally {
      // Enable the button again after the request finishes
      setIsCoaching(false);
    }
  };

  // Handles submitting the final question
  const handleSubmit = async (event) => {
    // Prevent the browser from refreshing the page
    event.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate the question before sending it to the backend
    if (!validateForm()) {
      return;
    }

    try {
      // Disable the submit button while posting
      setIsSubmitting(true);

      // Send the question to the backend
      const response = await createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      // Show the success message returned by the backend
      setSuccess(response.message || "Question posted successfully.");

      // Clear the form after successful submission
      setFormData({
        title: "",
        content: "",
      });

      // Remove the old AI feedback
      setCoachFeedback(null);

      // Redirect to the dashboard after one second
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      // Display the backend error if one exists
      const message =
        err.response?.data?.message ||
        "Unable to post your question. Please try again.";

      setError(message);
    } finally {
      // Enable the submit button again
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page title and instructions */}
        <div className={styles.header}>
          <h1>Ask a Question</h1>

          <p>
            Ask a clear programming question and provide enough details so other
            developers can understand and help you.
          </p>
        </div>

        {/* Question form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Question title input */}
          <div className={styles.formGroup}>
            <label htmlFor="title">Question Title</label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="What is your question?"
              disabled={isSubmitting || isCoaching}
            />
          </div>

          {/* Question content textarea */}
          <div className={styles.formGroup}>
            <label htmlFor="content">Question Details</label>

            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Explain your problem in detail..."
              rows={10}
              disabled={isSubmitting || isCoaching}
            />
          </div>

          {/* Display validation or API error */}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {/* Display successful submission message */}
          {success && <div className={styles.success}>{success}</div>}

          {/* Action buttons */}
          <div className={styles.actions}>
            {/* AI Draft Coach button */}
            <button
              type="button"
              onClick={handleGetFeedback}
              disabled={isSubmitting || isCoaching}
              className={styles.aiButton}
            >
              {isCoaching ? "Getting AI Feedback..." : "Get AI Feedback"}
            </button>

            {/* Submit question button */}
            <button
              type="submit"
              disabled={isSubmitting || isCoaching}
              className={styles.submitButton}
            >
              {isSubmitting ? "Posting..." : "Submit Question"}
            </button>
          </div>
        </form>

        {/* AI Draft Coach panel */}
        {coachFeedback && (
          <section className={styles.coachPanel}>
            <h2>AI Draft Coach</h2>

            {/* Display AI feedback */}
            {coachFeedback.feedback && (
              <div className={styles.feedback}>
                <h3>Feedback</h3>

                <p>{coachFeedback.feedback}</p>
              </div>
            )}

            {/* Display AI suggestions */}
            {Array.isArray(coachFeedback.suggestions) &&
              coachFeedback.suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <h3>Suggestions</h3>

                  <ul>
                    {coachFeedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
          </section>
        )}
      </div>
    </div>
  );
}
