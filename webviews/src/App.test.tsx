import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import { ServerStatus } from "../../src/commons/statuses";
import { vscode } from "./utils/vscode";

// Mock the vscode module
jest.mock("./utils/vscode", () => ({
  vscode: {
    postMessage: jest.fn(),
  },
}));

describe("App Component", () => {
  // Get the mocked vscode.postMessage function
  const mockPostMessage = vscode.postMessage as jest.Mock;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Setup message event listener
    window.addEventListener = jest.fn(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === "message") {
          messageHandler = handler as (event: MessageEvent) => void;
        }
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main title", () => {
    render(<App />);
    const titleElement = screen.getByText(
      /Setup IBM Granite as your code assistant with Continue/i
    );
    expect(titleElement).toBeInTheDocument();
  });

  it("sends a message to vscode when the Setup Granite button is clicked", async () => {
    render(<App />);

    // Wait for initial setup calls to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ command: "init" });
    expect(mockPostMessage).toHaveBeenCalledWith({ command: "fetchStatus" });

    // Clear the mock to start fresh
    mockPostMessage.mockClear();

    // Simulate server status
    await act(async () => {
      messageHandler({
        data: {
          command: "status",
          data: {
            serverStatus: ServerStatus.started,
            modelStatuses: {},
          },
        },
      } as MessageEvent);
    });

    // Click the button
    const setupButton = screen.getByText("Setup Granite");
    await act(async () => {
      fireEvent.click(setupButton);
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check the last call was setupGranite with correct data
    expect(mockPostMessage).toHaveBeenCalledWith({
      command: "setupGranite",
      data: {
        chatModelId: "granite3.1-dense:2b",
        tabModelId: "granite3.1-dense:2b",
        embeddingsModelId: "granite-embedding:278m",
      },
    });
  });

  it("disables Setup Granite button when server is not started", async () => {
    render(<App />);

    // Wait for initial setup
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Send server stopped status
    await act(async () => {
      messageHandler({
        data: {
          command: "status",
          data: {
            serverStatus: ServerStatus.stopped,
            modelStatuses: {},
          },
        },
      } as MessageEvent);
    });

    const setupButton = screen.getByText("Setup Granite");
    expect(setupButton).toBeDisabled();
  });

  it("initializes and requests status on mount", async () => {
    // Render and wait for initial calls
    await act(async () => {
      render(<App />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check initialization calls were made in order
    expect(mockPostMessage.mock.calls[0][0]).toEqual({ command: "init" });
    expect(mockPostMessage.mock.calls[1][0]).toEqual({
      command: "fetchStatus",
    });
  });

  it("handles model selections correctly", async () => {
    render(<App />);

    // Wait for initial setup
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Clear initial calls
    mockPostMessage.mockClear();

    // Simulate server started status
    await act(async () => {
      messageHandler({
        data: {
          command: "status",
          data: {
            serverStatus: ServerStatus.started,
            modelStatuses: {},
          },
        },
      } as MessageEvent);
    });

    // Click the setup button
    const setupButton = screen.getByText("Setup Granite");
    await act(async () => {
      fireEvent.click(setupButton);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the setupGranite call
    expect(mockPostMessage).toHaveBeenCalledWith({
      command: "setupGranite",
      data: {
        chatModelId: "granite3.1-dense:2b",
        tabModelId: "granite3.1-dense:2b",
        embeddingsModelId: "granite-embedding:278m",
      },
    });
  });
});
