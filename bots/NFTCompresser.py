import os
import subprocess

directory = "./images"

# loop through each file in the directory
for filename in os.listdir(directory):
    if filename.endswith(".png"):
        filepath = os.path.join(directory, filename)
        # run pngquant on the file with a max filesize of 1MB
        # check if the filesize is still over 1MB
        # if it is, run pngquant again
        # repeat until the filesize is under 1MB
        cursize = os.path.getsize(filepath)
        while cursize > 1000000:
            subprocess.run(["pngquant", "--quality=80-100", "--speed=1",
                            "--force", "--output", filepath, "--", filepath])

            print(
                f"Compressed {filename} from {cursize} bytes to {os.path.getsize(filepath)} bytes")
            cursize = os.path.getsize(filepath)
