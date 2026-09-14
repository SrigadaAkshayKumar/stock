import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ContactForm from "./ContactForm";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderContactForm = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<ContactForm />);
  });

  return { container, root };
};

const changeInput = (input, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  ).set;

  act(() => {
    valueSetter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ContactForm email validation", () => {
  test("accepts a valid email address beginning with a digit", () => {
    const { container, root } = renderContactForm();
    const emailInput = container.querySelector('input[name="email"]');

    changeInput(emailInput, "1alice@example.com");

    expect(container.textContent).not.toContain("Please enter a valid email address.");

    act(() => root.unmount());
  });

  test("accepts a valid email address beginning with a letter", () => {
    const { container, root } = renderContactForm();
    const emailInput = container.querySelector('input[name="email"]');

    changeInput(emailInput, "alice1@example.com");

    expect(container.textContent).not.toContain("Please enter a valid email address.");

    act(() => root.unmount());
  });

  test("rejects a malformed email address", () => {
    const { container, root } = renderContactForm();
    const emailInput = container.querySelector('input[name="email"]');

    changeInput(emailInput, "1alice@");

    expect(container.textContent).toContain("Please enter a valid email address.");

    act(() => root.unmount());
  });

  test("keeps existing name validation unchanged", () => {
    const { container, root } = renderContactForm();
    const firstNameInput = container.querySelector('input[name="firstName"]');

    changeInput(firstNameInput, "Ayan123");

    expect(container.textContent).toContain("Only letters and spaces are allowed.");

    act(() => root.unmount());
  });
});
