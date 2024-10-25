import { vscode } from "./utils/vscode";
import "./App.css";
import { useCallback, useEffect, useState } from "react";
import ModelList, { ModelOption } from "./ModelList";
import { ProgressData } from "../../src/commons/progressData";
import { getStandardName } from "../../src/commons/naming";
import { ModelStatus, ServerStatus } from "../../src/commons/statuses";
import { StatusCheck, StatusValue } from "./StatusCheck";
import { FaTriangleExclamation, FaXmark } from "react-icons/fa6";


function App() {
  const modelOptions: ModelOption[] = [
    { label: 'granite-code:3b', value: 'granite-code:3b', info: '2.0 GB' },
    { label: 'granite-code:8b', value: 'granite-code:8b', info: '4.6 GB' },
    { label: 'granite-code:20b', value: 'granite-code:20b', info: '12 GB' },
    { label: 'granite-code:34b', value: 'granite-code:34b', info: '19 GB' },
    { label: 'Keep existing configuration', value: null, info: null }
  ];
  
  const tabOptions: ModelOption[] = [
    { label: 'granite-code:3b', value: 'granite-code:3b', info: '2.0 GB' },
    { label: 'granite-code:8b', value: 'granite-code:8b', info: '4.6 GB' },
    { label: 'Keep existing configuration', value: null, info: null }
  ];

  const embeddingsOptions: ModelOption[] = [
    { label: 'nomic-embed-text', value: 'nomic-embed-text:latest', info: '274 MB' },
    { label: 'Keep existing configuration', value: null, info: null }
  ];

  const [tabModel, setTabModel] = useState<string | null>(tabOptions[1].value); //use 8b by default
  const [chatModel, setChatModel] = useState<string | null>(modelOptions[1].value);//use 8b by default
  const [embeddingsModel, setEmbeddingsModel] = useState<string | null>(embeddingsOptions[0].value);

  const [modelPullProgress, setModelPullProgress] = useState<{
    [key: string]: ProgressData | undefined
  }>({});

  const [serverStatus, setServerStatus] = useState<ServerStatus>(ServerStatus.unknown);
  const [modelStatuses, setModelStatuses] = useState<Map<string, ModelStatus>>(new Map());
  const [installationModes, setInstallationModes] = useState<{ id: string, label: string, supportsRefresh: true }[]>([]);

  const [enabled, setEnabled] = useState<boolean>(true);

  const [isKeepExistingConfigSelected, setIsKeepExistingConfigSelected] = useState(false);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const [isShowWarningMessage, setIsShowWarningMessage] = useState(true);

  const getModelStatus = useCallback((model: string | null): ModelStatus | null => {
    if (model === null) {
      return null;
    }
    const result = modelStatuses.get(getStandardName(model));
    return result ? result : ModelStatus.unknown;
  }, [modelStatuses]);

  function requestStatus(): void {
    vscode.postMessage({
      command: 'fetchStatus'
    });
  }

  function init(): void {
    vscode.postMessage({
      command: 'init'
    });
  }

  function handleInstallOllama(mode: string) {
    vscode.postMessage({
      command: "installOllama",
      data: {
        mode,
      }
    });
  }

  function handleSetupGraniteClick() {
    vscode.postMessage({
      command: "setupGranite",
      data: {
        tabModelId: tabModel,
        chatModelId: chatModel,
        embeddingsModelId: embeddingsModel
      }
    });
  }
  const REFETCH_MODELS_INTERVAL_MS = 1500;
  let ollamaStatusChecker: NodeJS.Timeout | undefined;

  const handleMessage = useCallback((event: any) => {
    const payload = event.data;
    const command: string | undefined = payload.command;
    if (!command) {
      return;
    }
    switch (command) {
      case 'init': {
        const data = payload.data;
        setInstallationModes(data.installModes);
        break;
      }
      case 'status': {
        const data = payload.data; // The JSON data our extension sent
        console.log('received status ' + JSON.stringify(data));
        setServerStatus(data.serverStatus);
        setModelStatuses(new Map(Object.entries(data.modelStatuses)));
        break;
      }
      case 'pull-progress': {
        const progress = payload.data.progress as ProgressData;
        const pulledModelName = progress.key;
        setModelPullProgress(prevProgress => ({
          ...prevProgress,
          [pulledModelName]: progress
        }));
        break;
      }
      case 'page-update': {
        const disabled = payload.data.installing;
        console.log(`${disabled ? 'dis' : 'en'}abling components`);
        setEnabled(!disabled);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    init();
    requestStatus();

    return () => {
      if (ollamaStatusChecker) {
        clearTimeout(ollamaStatusChecker);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  useEffect(() => {
    if (serverStatus === ServerStatus.started && modelOptions.every(model => getModelStatus(model.value) === ModelStatus.installed)) {
      console.log("Clearing ollamaStatusChecker");
      if (ollamaStatusChecker) {
        clearTimeout(ollamaStatusChecker);
      }
    } else {
      ollamaStatusChecker = setTimeout(requestStatus, REFETCH_MODELS_INTERVAL_MS);
    }

    return () => {
      if (ollamaStatusChecker) {
        clearTimeout(ollamaStatusChecker);
      }
    };
  }, [serverStatus, modelStatuses]);

  const getServerIconType = useCallback((status: ServerStatus): StatusValue => {
    switch (status) {
      case ServerStatus.installing:
        return 'installing';
      case ServerStatus.stopped:
        return 'partial';
      case ServerStatus.started:
        return 'complete';
      case ServerStatus.missing:
      default:
        return 'missing';
    }
  }, [serverStatus]);

  const getServerStatusLabel = useCallback((status: ServerStatus): string => {
    switch (status) {
      case ServerStatus.unknown:
        return 'Checking...';
      case ServerStatus.installing:
        return 'Installing...';
      case ServerStatus.stopped:
        return 'Stopped';
      case ServerStatus.started:
        return 'Started';
      default:
        return 'Not Installed';
    }
  }, [serverStatus]);

  useEffect(() => {
    const checkKeepExistingConfig =
      chatModel === null &&
      tabModel === null &&
      embeddingsModel === null;

    setIsKeepExistingConfigSelected(checkKeepExistingConfig);
  }, [chatModel, tabModel, embeddingsModel]);

  // For closing User Information Popup using close Icon
  function handleCloseWarningMessage(event: any) {
    event.stopPropagation();
    const clickedCard = event.target.closest('.user-info-card');
    if (clickedCard) {
      clickedCard.classList.add('hidden');
    }
  }

  useEffect(() => {
  // Check if selected chat model is installed
  const isChatModelInstalled = getModelStatus(chatModel) === ModelStatus.installed;
  // Check selected chat model is installing
  const isChatModelInstalling = getModelStatus(chatModel) === ModelStatus.installing;
  // Check if all models have completed their progress
  const allCompleted = Object.keys(modelPullProgress).every((modelName) => modelPullProgress[modelName]?.completed || false);
  // Checks if all models are installed
  const isAllInstalled = modelStatuses.size > 0 && Array.from(modelStatuses.values()).every(status => status === ModelStatus.installed);

  // Switch case based on modelStatus and progress
  switch (true) {
    case !isChatModelInstalled:
      setShowWarningMessage(false);
      break;
    case isAllInstalled:
      setShowWarningMessage(false);
      break;
    case isChatModelInstalling:
      setShowWarningMessage(true);
      break;
    default:
      setShowWarningMessage(true);
      break;
  }
}, [modelPullProgress, modelStatuses, chatModel]);

  return (
    <main className="main-wrapper">
      <h1 className="main-title">Setup IBM Granite Code as your code assistant with Continue</h1>
      <div className="main-description">
        <p className="m-0 mb-1">Run <a href="https://github.com/ibm-granite/granite-code-models" target="_blank" rel="noopener noreferrer">IBM Granite Code</a> models effortlessly with <a href="https://github.com/ollama/ollama" target="_blank" rel="noopener noreferrer"> Ollama</a> and <a href="https://github.com/continuedev/continue" target="_blank" rel="noopener noreferrer">Continue.dev</a>.
          Granite will help you write, generate, explain or document code, while your data stays secure and private on your own machine.</p>
      </div>
      <div className="form-group-wrapper">
        <div className="form-group">
          <div className="ollama-status-wrapper">
            <label>
              <StatusCheck type={getServerIconType(serverStatus)} />
              <span>Ollama status:</span>
              <span>{getServerStatusLabel(serverStatus)}</span>
            </label>

            {/* New section for additional buttons */}
            {serverStatus === ServerStatus.missing && installationModes.length > 0 && (
              <div className="install-options">
                {installationModes.some(mode => mode.supportsRefresh === true) && (
                  <p><span>This page will refresh once Ollama is installed.</span></p>
                )}
                {installationModes.map((mode) => (
                  <button
                    key={mode.id}
                    className="install-button"
                    onClick={() => handleInstallOllama(mode.id)}
                    disabled={!enabled}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModelList
          className="model-list"
          label="Chat model"
          value={chatModel}
          onChange={(e) => setChatModel(e?.value ?? null)}
          status={getModelStatus(chatModel)}
          options={modelOptions}
          progress={chatModel ? modelPullProgress[chatModel] : undefined}
          disabled={!enabled}
        />

        <ModelList
          className="model-list"
          label="Tab completion model"
          value={tabModel}
          onChange={(e) => setTabModel(e?.value ?? null)}
          status={getModelStatus(tabModel)}
          options={tabOptions}
          progress={tabModel ? modelPullProgress[tabModel] : undefined}
          disabled={!enabled}
        />

        <ModelList
          className="model-list"
          label="Embeddings model"
          value={embeddingsModel}
          onChange={(e) => setEmbeddingsModel(e?.value ?? null)}
          status={getModelStatus(embeddingsModel)}
          options={embeddingsOptions}
          progress={embeddingsModel ? modelPullProgress[embeddingsModel] : undefined}
          disabled={!enabled}
        />

        <div className="final-setup-group">
          <button className="install-button" onClick={handleSetupGraniteClick} disabled={serverStatus !== ServerStatus.started || !enabled || isKeepExistingConfigSelected}>Setup Granite Code</button>
        </div >
      </div >
      
      {/* User Information Popup to select IBM Granite Code Models  */}
      {showWarningMessage ? (
        <>
          <div className="user-info-wrap">
            <div className={`user-info-card bottom mt-1 ${isShowWarningMessage ? 'slide-right' : ''}`}>
              <FaTriangleExclamation className="exclamation mr-1" />
              <p className="m-0 mb-1">
                Once IBM Granite Code has been set up, choose the
                <strong> {chatModel}</strong> chat model from the Continue's chat model
                dropdown.
              </p>
              <FaXmark className="close-icon ml-1" onClick={(event) => handleCloseWarningMessage(event)} />
            </div>

            <div className={`user-info-card bottom mt-1 ${isShowWarningMessage ? 'slide-right' : ''}`}>
              <FaTriangleExclamation className="exclamation mr-1" />
              <p className="m-0 mb-1">
                Upon launching Continue.dev, a welcome screen will be displayed.
                Make sure to close it before setting up IBM Granite Code Models.
              </p>
              <FaXmark className="close-icon ml-1" onClick={(event) => handleCloseWarningMessage(event)} />
            </div>

          </div>
        </>
      ) : (
        <></>
      )}
    </main >
  );
}

export default App;
