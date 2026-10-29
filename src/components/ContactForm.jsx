import React, { useState } from "react";
import { LuGithub, LuMail, LuMapPin, LuSend } from "react-icons/lu";
import styles from "./ContactForm.module.css";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});

  const nameRegex = /^[a-zA-Z\s]*$/;
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateField = (name, value) => {
    let error = "";
    if (
      (name === "firstName" || name === "lastName") &&
      !nameRegex.test(value)
    ) {
      error = "Only letters and spaces are allowed.";
    }
    if (name === "email" && !emailRegex.test(value)) {
      error = "Please enter a valid email address.";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    let isValid = true;
    ["firstName", "lastName", "email"].forEach((field) => {
      if (!validateField(field, formData[field])) isValid = false;
    });
    return isValid && Object.values(errors).every((e) => e === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setStatus("Please correct the errors in the form.");
      return;
    }

    setStatus("Sending message...");
    const payload = {
      access_key: process.env.REACT_APP_ACCESS_KEY,
      ...formData,
    };

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setStatus("Message sent successfully!");
        setFormData({ firstName: "", lastName: "", email: "", message: "" });
        setErrors({});
      } else {
        setStatus("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("An error occurred. Please try again.");
    }
  };

  const sending = status === "Sending message...";
  const success = status.includes("successfully");

  return (
    <div className="page">
      <div className={styles.layout}>
        <section className={styles.intro}>
          <span className="eyebrow">Contact</span>
          <h1>Let's talk about smart investing</h1>
          <p className="muted">
            Questions about the platform, feedback on the analysis, or interested in collaborating? Send a
            message and we'll get back to you.
          </p>
          <ul className={styles.info}>
            <li>
              <span className={styles.infoIcon}>
                <LuMail />
              </span>
              <div>
                <strong>Email</strong>
                <a href="mailto:support@stockanalyzer.com">support@stockanalyzer.com</a>
              </div>
            </li>
            <li>
              <span className={styles.infoIcon}>
                <LuMapPin />
              </span>
              <div>
                <strong>Location</strong>
                <span>Bhubaneswar, Odisha, India</span>
              </div>
            </li>
            <li>
              <span className={styles.infoIcon}>
                <LuGithub />
              </span>
              <div>
                <strong>Open source</strong>
                <a href="https://github.com/SrigadaAkshayKumar/stock" target="_blank" rel="noopener noreferrer">
                  github.com/SrigadaAkshayKumar/stock
                </a>
              </div>
            </li>
          </ul>
        </section>

        <section className={`card ${styles.formCard}`}>
          <h2>Send a message</h2>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>First name</span>
                <input className="input" type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                {errors.firstName && <small className={styles.fieldError}>{errors.firstName}</small>}
              </label>
              <label className={styles.field}>
                <span>Last name</span>
                <input className="input" type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                {errors.lastName && <small className={styles.fieldError}>{errors.lastName}</small>}
              </label>
            </div>
            <label className={styles.field}>
              <span>Email</span>
              <input className="input" type="email" name="email" value={formData.email} onChange={handleChange} required />
              {errors.email && <small className={styles.fieldError}>{errors.email}</small>}
            </label>
            <label className={styles.field}>
              <span>Message</span>
              <textarea
                className="input"
                name="message"
                rows="6"
                placeholder="How can we help?"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
              <LuSend /> {sending ? "Sending…" : "Send message"}
            </button>
          </form>
          {status && <div className={`${styles.status} ${success ? styles.success : styles.error}`}>{status}</div>}
        </section>
      </div>
    </div>
  );
};

export default ContactForm;