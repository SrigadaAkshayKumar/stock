# Contribution Guidelines – Stock Analyzer

First off, thank you for considering contributing to **Stock Analyzer**! We're excited to build this powerful stock prediction and visualization tool with your help. Every contribution is welcome and greatly appreciated.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open-source project. In return, they should reciprocate that respect in addressing your issue or assessing pull requests.

<p align="center"><img src="https://i.imgur.com/jS8aH4j.gif" width="500"></p>

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

<p align="center"><img src="https://i.imgur.com/jS8aH4j.gif" width="500"></p>

## How to Contribute

Before you begin, please check the [Issues Section](https://github.com/SrigadaAkshayKumar/stock/issues).

### Reporting Bugs or Suggesting Enhancements

- **Found a Bug?** Look for an existing issue or open a new one. Please provide a clear title, a description of the bug, steps to reproduce it, and screenshots if possible.
- **Have a Feature Idea?** Open a new issue with a clear description of the feature, why it's needed, and any visual aids like mockups or screenshots. Please wait for feedback from a maintainer before you start working on a Pull Request.

### Your First Contribution

Unsure where to begin? You can start by looking for issues tagged with `good first issue` or `help wanted`. These are designed to be a great way to get familiar with the codebase.

<p align="center"><img src="https://i.imgur.com/jS8aH4j.gif" width="500"></p>

## The Contribution Workflow

1.  **Fork & Clone the Repository**
    - Fork the project to your own GitHub account.
    - Clone your fork to your local machine: `git clone https://github.com/YOUR_USERNAME/stock.git`

2.  **Set Up the Project Locally**
    - Follow the complete guide in our [`SETUP.md`](./SETUP.md) to get the backend and frontend running on your system.

3.  **Create a New Branch**
    - Always create a new branch for your changes. This keeps the history clean and your changes isolated.
    - Use a descriptive branch name, for example:
      ```bash
      git checkout -b feat/add-moving-average-indicator
      ```

4.  **Make Your Changes**
    - Write clean, readable code.
    - Add comments for complex logic.
    - Ensure your changes are fully tested locally before submitting.

5.  **Commit Your Changes**
    - We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps us maintain a clear and automated changelog.
    - Your commit message should be structured as follows:
      ```bash
      # Example commit messages
      git commit -m "feat: Add user authentication via JWT"
      git commit -m "fix: Correct calculation error in RSI indicator"
      git commit -m "docs: Update the setup guide in SETUP.md"
      ```
    - Common commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

6.  **Push and Create a Pull Request (PR)**
    - Push your branch to your fork on GitHub:
      ```bash
      git push origin feat/add-moving-average-indicator
      ```
    - Go to the original repository and open a Pull Request (PR) from your forked branch to the `main` branch.
    - Provide a clear title and a detailed description of your changes in the PR. Link to the issue you are solving by writing "Closes #issue-number".

<p align="center"><img src="https://i.imgur.com/jS8aH4j.gif" width="500"></p>

Thank you again for your contribution!