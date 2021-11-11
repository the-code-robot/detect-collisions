"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.System = void 0;

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.search.js");

var _sat = _interopRequireDefault(require("sat"));

var _rbush = _interopRequireDefault(require("rbush"));

var _model = require("./model");

var _box = require("./bodies/box");

var _circle = require("./bodies/circle");

var _polygon = require("./bodies/polygon");

var _point = require("./bodies/point");

var _utils = require("./utils");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * collision system
 */
class System {
  constructor() {
    this.response = new _sat.default.Response();
    this.tree = new _rbush.default();
  }
  /**
   * getter for all tree bodies
   */

  get bodies() {
    return this.tree.all();
  }
  /**
   * draw bodies
   * @param {CanvasRenderingContext2D} context
   */

  draw(context) {
    this.bodies.forEach((body) => {
      body.draw(context);
    });
  }
  /**
   * draw hierarchy
   * @param {CanvasRenderingContext2D} context
   */

  drawBVH(context) {
    this.tree.data.children.forEach((_ref) => {
      let { minX, maxX, minY, maxY, children } = _ref;

      _polygon.Polygon.prototype.draw.call(
        {
          pos: {
            x: minX,
            y: minY,
          },
          calcPoints: (0, _utils.createBox)(maxX - minX, maxY - minY),
        },
        context
      );
    });
    this.bodies.forEach((body) => {
      const { pos, w, h } = body.getAABBAsBox();

      _polygon.Polygon.prototype.draw.call(
        {
          pos,
          calcPoints: (0, _utils.createBox)(w, h),
        },
        context
      );
    });
  }
  /**
   * update body aabb and in tree
   * @param {object} body
   */

  updateBody(body) {
    this.tree.remove(body);
    body.updateAABB();
    this.tree.insert(body);
  }
  /**
   * update all bodies aabb
   */

  update() {
    this.bodies.forEach((body) => {
      this.updateBody(body);
    });
  }
  /**
   * separate (move away) colliders
   */

  separate() {
    this.checkAll((response) => {
      response.a.pos.x -= response.overlapV.x;
      response.a.pos.y -= response.overlapV.y;
      this.updateBody(response.a);
    });
  }
  /**
   * check one collider collisions with callback
   * @param {function} callback
   */

  checkOne(body, callback) {
    this.getPotentials(body).forEach((candidate) => {
      if (this.collides(body, candidate)) {
        callback(this.response);
      }
    });
  }
  /**
   * check all colliders collisions with callback
   * @param {function} callback
   */

  checkAll(callback) {
    this.bodies.forEach((body) => {
      this.checkOne(body, callback);
    });
  }
  /**
   * get object potential colliders
   * @param {object} collider
   */

  getPotentials(body) {
    // filter here is required as collides with self
    return this.tree.search(body).filter((candidate) => candidate !== body);
  }
  /**
   * check do 2 objects collide
   * @param {object} collider
   * @param {object} candidate
   */

  collides(body, candidate) {
    this.response.clear();

    if (
      body.type === _model.Types.Circle &&
      candidate.type === _model.Types.Circle
    ) {
      return _sat.default.testCircleCircle(body, candidate, this.response);
    }

    if (
      body.type === _model.Types.Circle &&
      candidate.type !== _model.Types.Circle
    ) {
      return _sat.default.testCirclePolygon(body, candidate, this.response);
    }

    if (
      body.type !== _model.Types.Circle &&
      candidate.type === _model.Types.Circle
    ) {
      return _sat.default.testPolygonCircle(body, candidate, this.response);
    }

    if (
      body.type !== _model.Types.Circle &&
      candidate.type !== _model.Types.Circle
    ) {
      return _sat.default.testPolygonPolygon(body, candidate, this.response);
    }
  }
  /**
   * create point
   * @param {Vector} position {x, y}
   */

  createPoint(position) {
    const point = new _point.Point(position);
    this.tree.insert(point);
    return point;
  }
  /**
   * create circle
   * @param {Vector} position {x, y}
   * @param {number} radius
   */

  createCircle(position, radius) {
    const circle = new _circle.Circle(position, radius);
    this.tree.insert(circle);
    return circle;
  }
  /**
   * create box
   * @param {Vector} position {x, y}
   * @param {number} width
   * @param {number} height
   * @param {number} angle
   */

  createBox(position, width, height) {
    let angle =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    const box = new _box.Box(position, width, height);
    box.setAngle(angle);
    this.tree.insert(box);
    return box;
  }
  /**
   * create polygon
   * @param {Vector} position {x, y}
   * @param {Vector[]} points
   * @param {number} angle
   */

  createPolygon(position, points) {
    let angle =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    const polygon = new _polygon.Polygon(position, points);
    polygon.setAngle(angle);
    this.tree.insert(polygon);
    return polygon;
  }
}

exports.System = System;
