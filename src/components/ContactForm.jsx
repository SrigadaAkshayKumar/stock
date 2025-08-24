import React, { useState, useEffect } from "react";
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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  return (
    <div className={styles["contact-container"]}>
      <div className={styles["contact-main"]}>
        {/* Left Section */}
        <div className={styles["contact-left"]}>
          <h2 className={styles["contact-title"]}>
            Let's talk about smart investments
          </h2>
          <p className={styles["contact-description"]}>
            Stock Analyzer helps you track, analyze, and understand market
            trends with ease. Get insights that empower smarter investment
            decisions.
          </p>
          <ul className={styles["contact-info"]}>
            <li>
              <span>✉️</span> support@stockanalyzer.com
            </li>
            <li>
              <span>📞</span> +1800-457-5834
            </li>
            <li>
              <span>📍</span> Bhubaneswar, Odisha
            </li>
          </ul>
        </div>

        {/* Right Section (Form) */}
        <div className={styles["contact-right"]}>
          <h2 className={styles["contact-form-title"]}>Request a Callback</h2>
          <form className={styles["contact-form"]} onSubmit={handleSubmit}>
            <div className={styles["contact-row"]}>
              <div className={styles["form-group"]}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && (
                  <span className={styles["contact-error"]}>
                    {errors.firstName}
                  </span>
                )}
              </div>
              <div className={styles["form-group"]}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && (
                  <span className={styles["contact-error"]}>
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div className={styles["form-group"]}>
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <span className={styles["contact-error"]}>{errors.email}</span>
              )}
            </div>

            <div className={styles["form-group"]}>
              <textarea
                name="message"
                rows="6"
                placeholder="Write your message here"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" disabled={status === "Sending message..."}>
              {status === "Sending message..." ? "Sending..." : "Send Message"}
            </button>
          </form>

          {status && (
            <div
              className={`${styles["contact-status"]} ${
                status.includes("successfully")
                  ? styles["success"]
                  : styles["error"]
              }`}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
