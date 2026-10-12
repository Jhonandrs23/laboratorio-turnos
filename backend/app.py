from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

turn_counter = 0
waiting_queue = []
windows = [
    {"id": 1, "name": "Ventanilla 1", "status": "available", "currentTurn": None},
    {"id": 2, "name": "Ventanilla 2", "status": "available", "currentTurn": None},
    {"id": 3, "name": "Ventanilla 3", "status": "available", "currentTurn": None},
    {"id": 4, "name": "Ventanilla 4", "status": "available", "currentTurn": None},
]


def make_turn(number):
    return f"A{number:02d}"


def snapshot():
    return {
        "waiting": waiting_queue,
        "windows": windows,
        "nextNumber": turn_counter + 1,
    }


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.get("/api/status")
def status():
    return jsonify(snapshot())


@app.post("/api/turns")
def create_turn():
    global turn_counter
    turn_counter += 1
    turn = make_turn(turn_counter)
    waiting_queue.append(turn)
    return jsonify({"turn": turn, **snapshot()}), 201


@app.post("/api/windows/<int:window_id>/assign")
def assign_turn(window_id):
    window = next((item for item in windows if item["id"] == window_id), None)
    if window is None:
        return jsonify({"error": "Ventanilla no encontrada"}), 404
    if window["status"] == "busy":
        return jsonify({"error": "La ventanilla esta ocupada"}), 409
    if not waiting_queue:
        return jsonify({"error": "No hay turnos en espera"}), 409

    turn = waiting_queue.pop(0)
    window["status"] = "busy"
    window["currentTurn"] = turn
    return jsonify({"assignedTurn": turn, **snapshot()})


@app.post("/api/windows/<int:window_id>/finish")
def finish_turn(window_id):
    window = next((item for item in windows if item["id"] == window_id), None)
    if window is None:
        return jsonify({"error": "Ventanilla no encontrada"}), 404

    finished_turn = window["currentTurn"]
    window["status"] = "available"
    window["currentTurn"] = None
    return jsonify({"finishedTurn": finished_turn, **snapshot()})


@app.post("/api/reset")
def reset():
    global turn_counter
    turn_counter = 0
    waiting_queue.clear()
    for window in windows:
        window["status"] = "available"
        window["currentTurn"] = None
    return jsonify(snapshot())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
