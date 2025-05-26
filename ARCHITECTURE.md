# Project Architecture

This document outlines the initial architectural decisions and technology stack for the project.

## 1. "Web-Native" Approach

The term "web-native" for this project will refer to an application built using web technologies (HTML, CSS, JavaScript) that can run locally and interact with hardware. Given the requirement for hardware communication (Serial, BLE), a browser-only application would be insufficient due to sandbox limitations.

Therefore, we will adopt an **Electron-based approach**. This involves:

*   A **web-based User Interface (UI)** built with modern frontend technologies.
*   A **local Node.js backend** integrated within Electron, responsible for:
    *   Direct hardware communication (Serial, BLE).
    *   Data processing and management.
    *   Serving the web UI.

This approach provides the best balance of web technology flexibility and the necessary system-level access for hardware interaction.

## 2. Proposed Technology Stack

### 2.1. Frontend

*   **React (with TypeScript):** Chosen for its robust component-based architecture, which aligns well with the concept of modular widgets. TypeScript will provide static typing for better code quality and maintainability.

### 2.2. Visualization

*   **D3.js:** For creating custom and highly interactive data visualizations.
*   **Plotly.js / Chart.js:** For implementing standard chart types quickly and efficiently. The choice between them (or using both) can be decided on a case-by-case basis depending on the specific chart requirements.

### 2.3. Application Shell & Local Backend

*   **Electron:** Will provide the native application shell and the environment for running the local Node.js backend.
*   **Node.js:** Will be used for:
    *   Hardware interfacing libraries (e.g., `serialport`, `noble`).
    *   Data acquisition and real-time processing.
    *   Potentially a local data store or database if needed.
    *   Serving the React frontend.

### 2.4. Styling

*   **Tailwind CSS** or **Styled-Components:**
    *   **Tailwind CSS:** Offers a utility-first approach, which can speed up development and ensure consistency.
    *   **Styled-Components:** Provides component-level styling, which integrates well with React.
    The final choice can be made during the initial UI development phase based on team preference and specific project needs.

## 3. Communication Flow

The primary communication pattern will be as follows:

1.  **Hardware Interaction:** The Electron **main process** (Node.js) will handle all direct communication with hardware devices via Serial, BLE, or other required protocols.
2.  **Data Processing:** Raw data from hardware will be processed, filtered, and transformed within the Electron main process.
3.  **Data Streaming to UI:** Processed data will be streamed to the React UI (running in an Electron **renderer process**). This will be achieved using:
    *   **IPC (Inter-Process Communication):** Electron's built-in IPC mechanisms (`ipcMain` and `ipcRenderer`) are suitable for sending messages and data between the main and renderer processes.
    *   **Local WebSockets:** For more complex streaming scenarios or if a more web-standard approach is preferred for data flow to the UI.
4.  **User Input:** User interactions in the React UI that require backend operations (e.g., initiating a hardware scan, sending a command to a device) will be sent back to the Electron main process via IPC.

This architecture aims to create a responsive user experience by offloading intensive tasks to the Node.js backend while leveraging web technologies for a flexible and modern UI.
