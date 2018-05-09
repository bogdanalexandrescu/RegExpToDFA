class Node {
    constructor(left, right) {
        this.left = left || null;
        this.right = right || null;
    }
}

/**
 * @returns {boolean}
 */
Node.prototype.nullable = function() {
    return true;
};

/**
 * @returns {Array}
 */
Node.prototype.firstpos = function() {
    return [];
};

/**
 * @returns {Array}
 */
Node.prototype.lastpos = function() {
    return [];
};

class Cat extends Node {
    toString() {
        return `Cat node`;
    }
}

Cat.prototype.nullable = function() {
    return this.left.nullable() && this.right.nullable();
};

Cat.prototype.firstpos = function() {
    let firstposArray = [];
    const leftNullable = this.left.nullable();
    const leftFirstpos = this.left.firstpos();
    const rightFirstpos = this.right.firstpos();
    if (leftNullable) {
        firstposArray = leftFirstpos.concat(rightFirstpos);
    } else {
        firstposArray = leftFirstpos;
    }

    return firstposArray;
};

Cat.prototype.lastpos = function() {
    let lastposArray = [];
    const rightNullable = this.right.nullable();
    const leftLastpos = this.left.lastpos();
    const rightLastpos = this.right.lastpos();
    if (rightNullable) {
        lastposArray = leftLastpos.concat(rightLastpos);
    } else {
        lastposArray = rightLastpos;
    }

    return lastposArray;
};

class OR extends Node {
    toString() {
        return `OR node`;
    }
}

OR.prototype.nullable = function() {
    return this.left.nullable() || this.right.nullable();
};

OR.prototype.firstpos = function() {
    let firstposArray = [];
    const leftFirstpos = this.left.firstpos();
    const rightFirstpos = this.right.firstpos();

    firstposArray = leftFirstpos.concat(rightFirstpos);

    return firstposArray;
};

OR.prototype.lastpos = function() {
    let lastposArray = [];
    const leftLastpos = this.left.lastpos();
    const rightLastpos = this.right.lastpos();

    lastposArray = leftLastpos.concat(rightLastpos);

    return lastposArray;
};

class Star extends Node {
    constructor(left) {
        super(left);
        delete this.right;
    }

    toString() {
        return `Star node`;
    }
}

Star.prototype.firstpos = function() {
    return this.left.firstpos();
};

Star.prototype.lastpos = function() {
    return this.left.lastpos();
};

class Leaf {
    constructor(value, id) {
        this.value = value;
        this.id = id;
    }

    toString() {
        return `Leaf with value ${this.value}`;
    }
}

Leaf.prototype.nullable = function() {
    return false;
};

Leaf.prototype.firstpos = function() {
    return [this.id];
};

Leaf.prototype.lastpos = function() {
    return [this.id];
};
