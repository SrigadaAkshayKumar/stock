import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ContactForm from "./ContactForm";

const getEmailInput = () => screen.getByPlaceholderText("Your Email");

const changeEmail = (value) => {
  fireEvent.change(getEmailInput(), { target: { name: "email", value } });
};

describe("ContactForm email validation", () => {
  test("accepts a valid email address beginning with a digit", () => {
    render(<ContactForm />);

    changeEmail("1alice@example.com");

    expect(screen.queryByText("Please enter a valid email address.")).toBeNull();
  });

  test("accepts a valid email address beginning with a letter", () => {
    render(<ContactForm />);

    changeEmail("alice1@example.com");

    expect(screen.queryByText("Please enter a valid email address.")).toBeNull();
  });

  test("rejects a malformed email address", () => {
    render(<ContactForm />);

    changeEmail("1alice@");

    expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
  });

  test("keeps existing name validation unchanged", () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { name: "firstName", value: "Ayan123" },
    });

    expect(screen.getByText("Only letters and spaces are allowed.")).toBeInTheDocument();
  });
});
