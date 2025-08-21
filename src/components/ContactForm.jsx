import React, { useState } from "react";

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

  React.useEffect(() => {
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

  const isMobile = windowWidth <= 768;

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)",
      color: "#ffffff",
      padding: "0",
      margin: "0",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },

    header: {
      textAlign: "center",
      padding: isMobile ? "40px 20px 30px" : "60px 20px 40px",
      background: "transparent",
    },

    headerTitle: {
      fontSize: isMobile ? "2.5rem" : "clamp(2.5rem, 5vw, 4rem)",
      fontWeight: "700",
      background:
        "linear-gradient(135deg, #ff6b9d 0%, #c471ed 50%, #12c2e9 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      margin: "0",
      letterSpacing: "-0.02em",
    },

    mainContent: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "0 20px 40px" : "0 20px 80px",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "40px" : "60px",
      alignItems: isMobile ? "stretch" : "start",
    },

    leftSection: {
      padding: isMobile ? "20px 0" : "40px 0",
      flex: isMobile ? "none" : "1",
      order: isMobile ? 1 : 0,
    },

    sectionTitle: {
      fontSize: isMobile ? "2rem" : "clamp(2rem, 4vw, 3rem)",
      fontWeight: "700",
      background: "linear-gradient(135deg, #ff6b9d 0%, #ffa726 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      margin: "0 0 20px 0",
      letterSpacing: "-0.01em",
      textAlign: isMobile ? "center" : "left",
      textDecoration: "none",
      borderBottom: "none",
    },

    description: {
      fontSize: isMobile ? "1rem" : "1.1rem",
      lineHeight: "1.7",
      color: "#b0b0b0",
      marginBottom: isMobile ? "30px" : "40px",
      fontWeight: "400",
      textAlign: isMobile ? "center" : "left",
    },

    contactInfo: {
      listStyle: "none",
      padding: "0",
      margin: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: isMobile ? "center" : "flex-start",
    },

    contactItem: {
      display: "flex",
      alignItems: "center",
      marginBottom: "20px",
      fontSize: isMobile ? "0.9rem" : "1rem",
      color: "#d0d0d0",
      fontWeight: "500",
    },

    contactIcon: {
      marginRight: "15px",
      fontSize: "1.2rem",
      width: "24px",
    },

    rightSection: {
      background:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "20px",
      padding: isMobile ? "30px 20px" : "40px",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      flex: isMobile ? "none" : "1",
      order: isMobile ? 2 : 0,
    },

    formTitle: {
      fontSize: isMobile ? "1.5rem" : "1.8rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #ff6b9d 0%, #ffa726 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      margin: "0 0 30px 0",
      textAlign: "center",
      textDecoration: "none",
      borderBottom: "none",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },

    formRow: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "20px" : "15px",
    },

    formGroup: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },

    input: {
      width: "100%",
      padding: isMobile ? "14px 16px" : "16px 20px",
      fontSize: isMobile ? "16px" : "1rem",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      outline: "none",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },

    textarea: {
      width: "100%",
      padding: isMobile ? "14px 16px" : "16px 20px",
      fontSize: isMobile ? "16px" : "1rem",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      outline: "none",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: isMobile ? "100px" : "120px",
      boxSizing: "border-box",
    },

    error: {
      color: "#ff6b6b",
      fontSize: "0.85rem",
      marginTop: "6px",
      fontWeight: "500",
    },

    button: {
      background: "linear-gradient(135deg, #ff6b9d 0%, #ffa726 100%)",
      color: "#ffffff",
      border: "none",
      padding: isMobile ? "16px 32px" : "18px 40px",
      borderRadius: "50px",
      fontSize: isMobile ? "1rem" : "1.1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      outline: "none",
      letterSpacing: "0.01em",
      boxShadow: "0 8px 30px rgba(255, 107, 157, 0.3)",
      width: isMobile ? "100%" : "auto",
    },

    buttonDisabled: {
      opacity: "0.7",
      cursor: "not-allowed",
      transform: "none",
    },

    status: {
      textAlign: "center",
      marginTop: "20px",
      fontSize: isMobile ? "0.9rem" : "1rem",
      fontWeight: "600",
      padding: "12px",
      borderRadius: "8px",
    },

    statusSuccess: {
      color: "#4ade80",
      background: "rgba(74, 222, 128, 0.1)",
      border: "1px solid rgba(74, 222, 128, 0.3)",
    },

    statusError: {
      color: "#ef4444",
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {/* <h1 style={styles.headerTitle}>Get in touch</h1> */}
      </header>

      <div style={styles.mainContent}>
        <div style={styles.leftSection}>
          <h2 style={styles.sectionTitle}>
            Let's talk about smart investments
          </h2>
          <p style={styles.description}>
            Stock Analyzer helps you track, analyze, and understand market
            trends with ease. Get insights that empower smarter investment
            decisions.
          </p>

          <ul style={styles.contactInfo}>
            <li style={styles.contactItem}>
              <span style={styles.contactIcon}>✉️</span>
              support@stockanalyzer.com
            </li>
            <li style={styles.contactItem}>
              <span style={styles.contactIcon}>📞</span>
              +1800-457-5834
            </li>
            <li style={styles.contactItem}>
              <span style={styles.contactIcon}>📍</span>
              Bhubaneswar, Odisha
            </li>
          </ul>
        </div>

        <div style={styles.rightSection}>
          <h2 style={styles.formTitle}>Request a Callback</h2>
          <div style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #ff6b9d";
                    e.target.style.background = "rgba(255, 255, 255, 0.08)";
                    e.target.style.boxShadow =
                      "0 8px 25px rgba(255, 107, 157, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border =
                      "1px solid rgba(255, 255, 255, 0.15)";
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                />
                {errors.firstName && (
                  <span style={styles.error}>{errors.firstName}</span>
                )}
              </div>
              <div style={styles.formGroup}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #ff6b9d";
                    e.target.style.background = "rgba(255, 255, 255, 0.08)";
                    e.target.style.boxShadow =
                      "0 8px 25px rgba(255, 107, 157, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border =
                      "1px solid rgba(255, 255, 255, 0.15)";
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                />
                {errors.lastName && (
                  <span style={styles.error}>{errors.lastName}</span>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                onFocus={(e) => {
                  e.target.style.border = "1px solid #ff6b9d";
                  e.target.style.background = "rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow =
                    "0 8px 25px rgba(255, 107, 157, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                  e.target.style.background = "rgba(255, 255, 255, 0.05)";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
              {errors.email && <span style={styles.error}>{errors.email}</span>}
            </div>

            <div style={styles.formGroup}>
              <textarea
                name="message"
                rows="6"
                placeholder="Write your message here"
                value={formData.message}
                onChange={handleChange}
                style={styles.textarea}
                onFocus={(e) => {
                  e.target.style.border = "1px solid #ff6b9d";
                  e.target.style.background = "rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow =
                    "0 8px 25px rgba(255, 107, 157, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255, 255, 255, 0.15)";
                  e.target.style.background = "rgba(255, 255, 255, 0.05)";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
            </div>

            <button
              type="button"
              disabled={status === "Sending message..."}
              style={{
                ...styles.button,
                ...(status === "Sending message..."
                  ? styles.buttonDisabled
                  : {}),
              }}
              onClick={handleSubmit}
              onMouseEnter={(e) => {
                if (status !== "Sending message...") {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 12px 40px rgba(255, 107, 157, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (status !== "Sending message...") {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow =
                    "0 8px 30px rgba(255, 107, 157, 0.3)";
                }
              }}
            >
              {status === "Sending message..." ? "Sending..." : "Send Message"}
            </button>
          </div>

          {status && (
            <div
              style={{
                ...styles.status,
                ...(status.includes("successfully")
                  ? styles.statusSuccess
                  : styles.statusError),
              }}
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
