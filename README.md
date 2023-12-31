# Create Logic Simulator

This CLI tool provides a template for state-machine-based applications built on [xstate](https://github.com/statelyai/xstate), [statelyai/inspect](https://github.com/statelyai/inspect), [msw](https://github.com/mswjs/msw). Using this tool allows you to skip tedious setup processes and start developing your desired application immediately.

## Usage

### Interactive

You can create projects interactively by running:

```bash
npm create logic-simulator
# or
yarn create logic-simulator
# or
pnpm create logic-simulator
```

Then follow the prompts

### Non-interactive

You can use template option (available options: `vanilla-js`, `vanilla-ts`, `react-js`, `react-ts`)

```bash
npm create logic-simulator@latest <project-directory> -- --template react-ts
# or
yarn create logic-simulator <project-directory> --template react-ts
# or
pnpm create logic-simulator <project-directory> --template react-ts
```
