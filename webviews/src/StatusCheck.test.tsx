import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusCheck, StatusValue } from './StatusCheck';

// Mock react-icons/vsc
jest.mock('react-icons/vsc', () => ({
  VscArrowCircleDown: jest.fn(props => (
    <div data-testid="vsc-arrow-circle-down" title={props.title}>
      ArrowCircleDown
    </div>
  )),
  VscCircleLarge: jest.fn(props => (
    <div data-testid="vsc-circle-large" title={props.title}>
      CircleLarge
    </div>
  )),
  VscCircleLargeFilled: jest.fn(props => (
    <div data-testid="vsc-circle-large-filled" title={props.title}>
      CircleLargeFilled
    </div>
  )),
  VscPass: jest.fn(props => (
    <div data-testid="vsc-pass" title={props.title}>
      Pass
    </div>
  )),
  VscPassFilled: jest.fn(props => (
    <div data-testid="vsc-pass-filled" title={props.title}>
      PassFilled
    </div>
  )),
  VscStopCircle: jest.fn(props => (
    <div data-testid="vsc-stop-circle" title={props.title}>
      StopCircle
    </div>
  ))
}));

// Import the mocked modules
const {
  VscArrowCircleDown,
  VscCircleLarge,
  VscCircleLargeFilled,
  VscPass,
  VscPassFilled,
  VscStopCircle
} = jest.requireMock('react-icons/vsc');

describe('StatusCheck Component', () => {
  const defaultColor = "var(--vscode-textLink-foreground)";
  const errorColor = "var(--vscode-errorForeground)";
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  it('renders null type with CircleLargeFilled icon', () => {
    const { getByTestId } = render(<StatusCheck type={null} />);
    expect(getByTestId('vsc-circle-large-filled')).toBeInTheDocument();
    expect(VscCircleLargeFilled).toHaveBeenCalledWith(
      expect.objectContaining({ color: defaultColor }),
      expect.any(Object)
    );
  });

  it('renders complete type with PassFilled icon', () => {
    const { getByTestId } = render(<StatusCheck type="complete" />);
    expect(getByTestId('vsc-pass-filled')).toBeInTheDocument();
    expect(VscPassFilled).toHaveBeenCalledWith(
      expect.objectContaining({ color: defaultColor }),
      expect.any(Object)
    );
  });

  it('renders installing type with ArrowCircleDown icon', () => {
    const { getByTestId } = render(<StatusCheck type="installing" />);
    expect(getByTestId('vsc-arrow-circle-down')).toBeInTheDocument();
    expect(VscArrowCircleDown).toHaveBeenCalledWith(
      expect.objectContaining({ color: defaultColor }),
      expect.any(Object)
    );
  });

  it('renders partial type with Pass icon', () => {
    const { getByTestId } = render(<StatusCheck type="partial" />);
    expect(getByTestId('vsc-pass')).toBeInTheDocument();
    expect(VscPass).toHaveBeenCalledWith(
      expect.objectContaining({ color: defaultColor }),
      expect.any(Object)
    );
  });

  it('renders stopped type with Stop icon', () => {
    const { getByTestId } = render(<StatusCheck type="stopped" />);
    expect(getByTestId('vsc-stop-circle')).toBeInTheDocument();
    expect(VscStopCircle).toHaveBeenCalledWith(
      expect.objectContaining({ color: errorColor }),
      expect.any(Object)
    );
  });

  it('renders missing type with CircleLarge icon', () => {
    const { getByTestId } = render(<StatusCheck type="missing" />);
    expect(getByTestId('vsc-circle-large')).toBeInTheDocument();
    expect(VscCircleLarge).toHaveBeenCalledWith(
      expect.objectContaining({ title: undefined }),
      expect.any(Object)
    );
  });

  it('displays title when provided', () => {
    const title = "Test Title";
    const { getByTestId } = render(<StatusCheck type="complete" title={title} />);
    expect(getByTestId('vsc-pass-filled')).toHaveAttribute('title', title);
    expect(VscPassFilled).toHaveBeenCalledWith(
      expect.objectContaining({ title }),
      expect.any(Object)
    );
  });

  it('handles all possible status values', () => {
    const statusValues: (StatusValue | null)[] = [null, 'complete', 'installing', 'partial', 'missing', 'stopped'];
    const testIds = {
      null: 'vsc-circle-large-filled',
      complete: 'vsc-pass-filled',
      installing: 'vsc-arrow-circle-down',
      partial: 'vsc-pass',
      missing: 'vsc-circle-large',
      stopped: 'vsc-stop-circle'
    };

    statusValues.forEach(status => {
      const { getByTestId } = render(<StatusCheck type={status} />);
      expect(getByTestId(testIds[status as keyof typeof testIds])).toBeInTheDocument();
    });
  });

  it('accepts undefined title prop', () => {
    const { container } = render(<StatusCheck type="complete" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors with invalid type', () => {
    // @ts-ignore - Testing invalid type
    const { getByTestId } = render(<StatusCheck type="invalid" />);
    expect(getByTestId('vsc-circle-large')).toBeInTheDocument();
  });

  it('passes correct props to icons', () => {
    const title = "Test Title";
    render(<StatusCheck type="complete" title={title} />);
    expect(VscPassFilled).toHaveBeenCalledWith(
      expect.objectContaining({
        color: defaultColor,
        title
      }),
      expect.any(Object)
    );
  });
});
