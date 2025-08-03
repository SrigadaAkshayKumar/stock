import { useState } from "react";
// Note: Configure REACT_APP_WEB3FORMS_ACCESS_KEY in your .env file
// Get your access key from https://web3forms.com

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      access_key: process.env.REACT_APP_WEB3FORMS_ACCESS_KEY, // 🔐 Uses environment variable for security
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
      } else {
        setStatus("Failed to send message.");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("An error occurred. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    lineHeight: "1.5",
    outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "border-color 0.3s ease",
    textIndent: "2px",
    fontFamily: "Segoe UI, sans-serif",
  };

  const inputFocusStyle = {
    borderColor: "#4CAF50",
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "30px auto",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "12px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "24px", color: "#333" }}>
        Contact Us
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
          onBlur={(e) => (e.target.style.borderColor = "#ccc")}
        />

        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <textarea
            name="message"
            placeholder="Write your message..."
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
            style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
            onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
        >
          Send Message
        </button>
      </form>

      {status && (
        <p
          style={{
            marginTop: "20px",
            color: status.includes("successfully") ? "green" : "red",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
};

export default ContactForm;
