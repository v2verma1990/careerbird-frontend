#!/usr/bin/env python3
"""
Script to install WeasyPrint and its dependencies properly
"""

import subprocess
import sys
import platform
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed:")
        print(f"  Error: {e.stderr}")
        return False

def install_weasyprint():
    """Install WeasyPrint and its dependencies"""
    system = platform.system().lower()
    
    print(f"Installing WeasyPrint on {system}...")
    
    # Install Python dependencies
    commands = [
        ("pip install --upgrade pip", "Upgrading pip"),
        ("pip install weasyprint", "Installing WeasyPrint"),
        ("pip install beautifulsoup4", "Installing BeautifulSoup4"),
    ]
    
    # System-specific dependencies
    if system == "windows":
        print("On Windows, WeasyPrint should work with the Python installation.")
        print("If you encounter issues, you may need to install GTK+ for Windows.")
        
    elif system == "darwin":  # macOS
        commands.insert(0, ("brew install cairo pango gdk-pixbuf libffi", "Installing macOS dependencies via Homebrew"))
        
    elif system == "linux":
        # Try to detect the Linux distribution
        try:
            with open('/etc/os-release', 'r') as f:
                os_info = f.read().lower()
                
            if 'ubuntu' in os_info or 'debian' in os_info:
                commands.insert(0, ("sudo apt-get update && sudo apt-get install -y python3-dev python3-pip python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0", "Installing Ubuntu/Debian dependencies"))
            elif 'centos' in os_info or 'rhel' in os_info or 'fedora' in os_info:
                commands.insert(0, ("sudo yum install -y python3-devel python3-pip python3-cffi python3-brotli pango harfbuzz", "Installing CentOS/RHEL/Fedora dependencies"))
            else:
                print("Unknown Linux distribution. You may need to install system dependencies manually.")
                
        except FileNotFoundError:
            print("Could not detect Linux distribution. You may need to install system dependencies manually.")
    
    # Run all commands
    success = True
    for command, description in commands:
        if not run_command(command, description):
            success = False
    
    if success:
        print("\n✓ WeasyPrint installation completed successfully!")
        print("You can now generate PDFs from HTML content.")
    else:
        print("\n✗ Some installation steps failed.")
        print("Please check the error messages above and install missing dependencies manually.")
    
    return success

def test_weasyprint():
    """Test if WeasyPrint is working correctly"""
    print("\nTesting WeasyPrint installation...")
    
    try:
        import weasyprint
        
        # Create a simple test HTML
        test_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
            </style>
        </head>
        <body>
            <h1>WeasyPrint Test</h1>
            <p>This is a test document to verify WeasyPrint is working correctly.</p>
        </body>
        </html>
        """
        
        # Try to create a PDF
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            weasyprint.HTML(string=test_html).write_pdf(tmp_file.name)
            print(f"✓ WeasyPrint test successful! Test PDF created at: {tmp_file.name}")
            
            # Clean up test file
            try:
                os.unlink(tmp_file.name)
            except:
                pass
                
        return True
        
    except ImportError:
        print("✗ WeasyPrint is not installed or not importable")
        return False
    except Exception as e:
        print(f"✗ WeasyPrint test failed: {e}")
        return False

if __name__ == "__main__":
    print("WeasyPrint Installation Script")
    print("=" * 40)
    
    # Install WeasyPrint
    if install_weasyprint():
        # Test the installation
        test_weasyprint()
    
    print("\nInstallation script completed.")