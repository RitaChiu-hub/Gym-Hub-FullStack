import { useRef, useState } from "react";
import Button from "./Button";

const API = "http://localhost:3000/api";

function Modal() {
  const dialogRef  = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState({ name: "", email: "", message: "" });

  const openModal  = () => { setSubmitted(false); setError(""); setForm({ name:"", email:"", message:"" }); dialogRef.current.showModal(); };
  const closeModal = () => dialogRef.current.close();

  const updateForm = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/messages`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message. Please try again.");
        return;
      }
      setSubmitted(true);
      dialogRef.current.close();
    } catch (err) {
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="modal-section">
      <Button type="button" visual="link" onClick={openModal}>Contact Us</Button>

      {submitted && (
        <p className="modal-feedback" role="status">
          Your message has been sent! We will contact you soon.
        </p>
      )}

      <dialog ref={dialogRef} className="contact-dialog">
        <h2 className="dialog-title">Send Us a Message</h2>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" value={form.name} onChange={updateForm} required />
          </div>
          <div className="form-group">
            <label htmlFor="contact-email">Email</label>
            <input type="email" id="contact-email" name="email" value={form.email} onChange={updateForm} required />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" value={form.message} onChange={updateForm} required />
          </div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <Button type="submit" visual="link" disabled={loading}>
              {loading ? "Sending..." : "Submit"}
            </Button>
            <Button type="button" visual="button" onClick={closeModal} disabled={loading}>Cancel</Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

export default Modal;