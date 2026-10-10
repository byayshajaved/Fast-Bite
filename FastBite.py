import mysql.connector
from fastbite_db import load_menu, save_order


def main():
    try:
        menu, menu_item_ids = load_menu()
    except (mysql.connector.Error, RuntimeError) as error:
        print(f"Unable to load menu from MySQL: {error}")
        return 1

    print("Welcome to FastBite!")
    print("-------- Menu --------")

    for items, price in menu.items():
        print(f"{items} : Rs. {price}")

    order = []
    total = 0

    while True:
        item = input("Enter the item you want to order (or 'Done' to finish): ").title()

        if item == "Done":
            break

        if item in menu:
            quantity = int(input("Enter quantity: "))
            order.append((item, quantity))
            total += menu[item] * quantity
            print(f"{quantity} x {item} added!")
            print(f"Current Total: Rs. {total}")
        else:
            print("Sorry, this item is not available.")

    if order:
        order_items = [
            (menu_item_ids[item], quantity)
            for item, quantity in order
        ]
        try:
            saved_order = save_order(order_items)
        except (mysql.connector.Error, RuntimeError, ValueError) as error:
            print(f"Unable to save order to MySQL: {error}")
            return 1

        total = saved_order["total_amount"]
        for saved_item in saved_order["items"]:
            menu[saved_item["item_name"]] = saved_item["unit_price"]

        print("\n-------- Bill --------")

        for item, quantity in order:
            price = menu[item]
            item_total = price * quantity
            print(f"{quantity} x {item}: Rs. {item_total}")

        print('------------------------------')
        print(f"Your Total bill is: Rs. {total}")
        print("Thankyou for ordering!")
    else:
        print("You did not order anything.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
