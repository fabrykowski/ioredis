import Redis from "../../lib/Redis";
import { getRedisVersion } from "../helpers/util";
import { expect } from "chai";

describe("transformer", () => {
  describe("default transformer", () => {
    describe("hmset", () => {
      it("should support object", (done) => {
        const redis = new Redis();
        redis.hmset("foo", { a: 1, b: "2" }, function (err, result) {
          expect(result).to.eql("OK");
          redis.hget("foo", "b", function (err, result) {
            expect(result).to.eql("2");
            done();
          });
        });
      });
      it("should support Map", (done) => {
        const redis = new Redis();
        const map = new Map();
        map.set("a", 1);
        map.set("b", "2");
        redis.hmset("foo", map, function (err, result) {
          expect(result).to.eql("OK");
          redis.hget("foo", "b", function (err, result) {
            expect(result).to.eql("2");
            done();
          });
        });
      });
      it("should not affect the old way", (done) => {
        const redis = new Redis();
        redis.hmset("foo", "a", 1, "b", "2", function (err, result) {
          expect(result).to.eql("OK");
          redis.hget("foo", "b", function (err, result) {
            expect(result).to.eql("2");
            done();
          });
        });
      });
    });

    describe("mset", () => {
      it("should support object", (done) => {
        const redis = new Redis();
        redis.mset({ a: 1, b: "2" }, function (err, result) {
          expect(result).to.eql("OK");
          redis.mget("a", "b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
      it("should support Map", (done) => {
        const redis = new Redis();
        const map = new Map();
        map.set("a", 1);
        map.set("b", "2");
        redis.mset(map, function (err, result) {
          expect(result).to.eql("OK");
          redis.mget("a", "b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
      it("should not affect the old way", (done) => {
        const redis = new Redis();
        redis.mset("a", 1, "b", "2", function (err, result) {
          expect(result).to.eql("OK");
          redis.mget("a", "b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
      it("should work with keyPrefix option", (done) => {
        const redis = new Redis({ keyPrefix: "foo:" });
        redis.mset({ a: 1, b: "2" }, function (err, result) {
          expect(result).to.eql("OK");
          const otherRedis = new Redis();
          otherRedis.mget("foo:a", "foo:b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
    });

    describe("msetnx", () => {
      it("should support object", (done) => {
        const redis = new Redis();
        redis.msetnx({ a: 1, b: "2" }, function (err, result) {
          expect(result).to.eql(1);
          redis.mget("a", "b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
      it("should support Map", (done) => {
        const redis = new Redis();
        const map = new Map();
        map.set("a", 1);
        map.set("b", "2");
        redis.msetnx(map, function (err, result) {
          expect(result).to.eql(1);
          redis.mget("a", "b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
      it("should not affect the old way", (done) => {
        const redis = new Redis();
        redis.msetnx("a", 1, "b", "2", function (err, result) {
          expect(result).to.eql(1);
          redis.mget("a", "b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
      it("should work with keyPrefix option", (done) => {
        const redis = new Redis({ keyPrefix: "foo:" });
        redis.msetnx({ a: 1, b: "2" }, function (err, result) {
          expect(result).to.eql(1);
          const otherRedis = new Redis();
          otherRedis.mget("foo:a", "foo:b", function (err, result) {
            expect(result).to.eql(["1", "2"]);
            done();
          });
        });
      });
    });

    describe("hgetall", () => {
      it("should return an object", (done) => {
        const redis = new Redis();
        redis.hmset("foo", "k1", "v1", "k2", "v2", () => {
          redis.hgetall("foo", function (err, result) {
            expect(result).to.eql({ k1: "v1", k2: "v2" });
            done();
          });
        });
      });

      it("should return {} when key not exists", (done) => {
        const redis = new Redis();
        redis.hgetall("foo", function (err, result) {
          expect(result).to.eql({});
          done();
        });
      });
    });

    describe("hset", () => {
      it("should support object", async () => {
        const redis = new Redis();
        const [major] = await getRedisVersion(redis);
        if (major < 4) {
          // Skip if redis is too outdated to hset multiple pairs at once.
          return;
        }
        // NOTE: could simplify these tests using await redis.hset instead,
        // but not sure if this is deliberately testing the transformers with callbacks
        return new Promise((resolve, reject) => {
          redis.hset("foo", { a: 1, b: "e", c: 123 }, function (err, result) {
            if (err) {
              return reject(err);
            }
            expect(result).to.eql(3);
            redis.hget("foo", "b", function (err, result) {
              expect(result).to.eql("e");
              resolve();
            });
          });
        });
      });
      it("should support Map", async () => {
        const redis = new Redis();
        const [major] = await getRedisVersion(redis);
        if (major < 4) {
          // Skip if redis is too outdated to hset multiple pairs at once.
          return;
        }
        const map = new Map();
        map.set("a", 1);
        map.set("b", "e");
        return new Promise((resolve, reject) => {
          redis.hset("foo", map, function (err, result) {
            if (err) {
              return reject(err);
            }
            expect(result).to.eql(2);
            redis.hget("foo", "b", function (err, result) {
              if (err) {
                return reject(err);
              }
              expect(result).to.eql("e");
              resolve();
            });
          });
        });
      });
      it("should affect the old way", async () => {
        const redis = new Redis();
        const [major] = await getRedisVersion(redis);
        if (major < 4) {
          // Skip if redis is too outdated to hset multiple pairs at once.
          return;
        }

        return new Promise((resolve) => {
          redis.hset("foo", "a", 1, "b", "e", function (err, result) {
            expect(result).to.eql(2);
            redis.hget("foo", "b", function (err, result) {
              expect(result).to.eql("e");
              resolve();
            });
          });
        });
      });
    });
  });
});
