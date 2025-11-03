"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
from pathlib import Path
from jupyterlab.galata import configure_jupyter_server

configure_jupyter_server(c)

# Set the root directory to the project root (parent of ui-tests)
# This allows tests to access the data/ directory
c.ServerApp.root_dir = str(Path(__file__).parent.parent)

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
