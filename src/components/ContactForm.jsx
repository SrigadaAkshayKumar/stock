import React, { useState } from "react";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({}); // State for validation errors

  // Regular expressions for validation
  const nameRegex = /^[a-zA-Z\s]*$/; // Allows letters and spaces
  const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Starts with letter, then valid email format

  const validateField = (name, value) => {
    let error = "";
    if (name === "firstName" || name === "lastName") {
      if (!nameRegex.test(value)) {
        error = "Only letters and spaces are allowed.";
      }
    } else if (name === "email") {
      if (!emailRegex.test(value)) {
        error = "Please enter a valid email address (must start with a letter).";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === ""; // Return true if valid, false otherwise
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value); // Validate field on change
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validate all fields
    if (!validateField("firstName", formData.firstName)) isValid = false;
    if (!validateField("lastName", formData.lastName)) isValid = false;
    if (!validateField("email", formData.email)) isValid = false;
    // Message field is already 'required' via HTML, no custom regex needed here unless more complex validation is desired.

    setErrors(newErrors); // Update errors state with any new validation issues
    return isValid && Object.values(errors).every(e => e === ""); // Ensure all fields are valid and no existing errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatus("Please correct the errors in the form.");
      return;
    }

    setStatus("Sending message..."); // Indicate sending
    const payload = {
      access_key: process.env.REACT_APP_ACCESS_KEY, // 🔐 Replace with your actual Web3Forms access key
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
        setErrors({}); // Clear errors on success
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
    marginBottom: "4px", // Reduced margin to make space for error messages
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    lineHeight: "1.5",
    outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "border-color 0.3s ease",
    textIndent: "2px",
    fontFamily: "Inter, sans-serif", // Changed to Inter as per instructions
  };

  const errorTextStyle = {
    color: "red",
    fontSize: "12px",
    marginBottom: "16px",
    marginTop: "4px",
    display: "block",
  };

  return (
    <div
      className="max-w-md mx-auto my-8 p-6 bg-gray-50 rounded-xl shadow-lg font-inter" // Using Tailwind for responsiveness and font
    >
      <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">
        Contact Us
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            style={inputStyle}
            className={`focus:border-green-500 ${errors.firstName ? 'border-red-500' : ''}`} // Tailwind for focus and error border
          />
          {errors.firstName && <span style={errorTextStyle}>{errors.firstName}</span>}
        </div>

        <div className="mb-4">
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={inputStyle}
            className={`focus:border-green-500 ${errors.lastName ? 'border-red-500' : ''}`}
          />
          {errors.lastName && <span style={errorTextStyle}>{errors.lastName}</span>}
        </div>

        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
            className={`focus:border-green-500 ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
        </div>

        <div className="mb-6">
          <textarea
            name="message"
            placeholder="Write your message..."
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
            style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
            className="focus:border-green-500"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors duration-300 shadow-md"
        >
          Send Message
        </button>
      </form>

      {status && (
        <p
          className={`mt-5 text-center font-bold ${status.includes("successfully") ? "text-green-700" : "text-red-600"
            }`}
        >
          {status}
        </p>
      )}
    </div>
  );
};

export default ContactForm;
