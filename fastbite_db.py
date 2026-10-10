import os
from decimal import Decimal

import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    user = os.getenv("MYSQL_USER")
    password = os.getenv("MYSQL_PASSWORD")
    if not user or password is None:
        raise RuntimeError(
            "Copy .env.example to .env and set MYSQL_USER and MYSQL_PASSWORD."
        )

    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=user,
        password=password, 
        database="fastbite",
    )


def get_menu_items():
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT menu_item_id, name, price FROM menu_items "
            "WHERE is_available = TRUE ORDER BY menu_item_id"
        )
        return [
            {"menu_item_id": menu_item_id, "name": name, "price": price}
            for menu_item_id, name, price in cursor.fetchall()
        ]
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


def load_menu():
    menu_items = get_menu_items()
    menu = {item["name"]: item["price"] for item in menu_items}
    menu_item_ids = {item["name"]: item["menu_item_id"] for item in menu_items}
    return menu, menu_item_ids


def save_order(order_items):
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor()
        connection.start_transaction()

        saved_items = []
        total_amount = Decimal("0.00")
        for menu_item_id, quantity in order_items:
            cursor.execute(
                "SELECT name, price FROM menu_items "
                "WHERE menu_item_id = %s AND is_available = TRUE",
                (menu_item_id,),
            )
            menu_row = cursor.fetchone()
            if menu_row is None:
                raise ValueError(f"Menu item {menu_item_id} is unavailable.")

            item_name, unit_price = menu_row
            unit_price = Decimal(str(unit_price))
            line_total = unit_price * quantity
            total_amount += line_total
            saved_items.append(
                {
                    "menu_item_id": menu_item_id,
                    "item_name": item_name,
                    "unit_price": unit_price,
                    "quantity": quantity,
                    "line_total": line_total,
                }
            )

        cursor.execute(
            "INSERT INTO orders (total_amount) VALUES (%s)",
            (total_amount,),
        )
        order_id = cursor.lastrowid

        for item in saved_items:
            cursor.execute(
                "INSERT INTO order_items "
                "(order_id, menu_item_id, item_name, unit_price, quantity) "
                "VALUES (%s, %s, %s, %s, %s)",
                (
                    order_id,
                    item["menu_item_id"],
                    item["item_name"],
                    item["unit_price"],
                    item["quantity"],
                ),
            )

        connection.commit()
        return {
            "order_id": order_id,
            "total_amount": total_amount,
            "items": saved_items,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()
