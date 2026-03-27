import { useRef, useState } from "react";
import Button from "./Button";

function Modal() {
  const dialogRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);

  const openModal = () => {
    setSubmitted(false);
    dialogRef.current.showModal();
  };

  const closeModal = () => {
    dialogRef.current.close();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    dialogRef.current.close();
  };

  return (
    <section className="modal-section">
      <Button type="button" visual="link" onClick={openModal}>
        Contact Us
      </Button>

      {submitted && (
        <p className="modal-feedback" role="status">
          Your message has been sent! We will contact you soon.
        </p>
      )}

      <dialog ref={dialogRef} className="contact-dialog">
        <h2 className="dialog-title">Send Us a Message</h2>
        <form className="dialog-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" required />
          </div>
          <div className="dialog-actions">
            {/* Button 用法 3：type="submit", visual="link" */}
            <Button type="submit" visual="link" onClick={handleSubmit}>
              Submit
            </Button>
            <Button type="button" visual="button" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

export default Modal;