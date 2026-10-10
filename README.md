# FastBite

FastBite is a Flask ordering app backed by MySQL.

## Setup on Windows

1. Install MySQL Server and make sure its service is running.
2. Open `setup_fastbite.sql` in MySQL Workbench and execute the whole script. It creates the `fastbite` database, tables, and starter menu.
3. From this project folder, install Python dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

4. Create your local configuration file and edit it with the same MySQL account you use in MySQL Workbench:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `MYSQL_USER` and `MYSQL_PASSWORD` in `.env`. The `.env` file is local and excluded from Git.
5. Start the app and open <http://127.0.0.1:5000>:

   ```powershell
   py app.py
   ```

The menu is loaded from available rows in `fastbite.menu_items`. If the menu is empty, execute `setup_fastbite.sql` again; its starter rows are safe to seed repeatedly.
