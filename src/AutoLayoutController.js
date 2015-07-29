/**
 * This Source Code is licensed under the MIT license. If a copy of the
 * MIT-license was not distributed with this file, You can obtain one at:
 * http://opensource.org/licenses/mit-license.html.
 *
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps, 2015
 */

// import dependencies
var Node = require('famous/core/Node');
var AutoLayout = require('autolayout');

/**
 * Constructor
 *
 * @param {Object} [options] options to set.
 * @param {String|Array} [options.visualFormat] String or array of strings containing VFL.
 * @param {Object} [options.layoutOptions] Options such as viewport, spacing, etc...
 * @return {AutoLayoutController} this
 */
function AutoLayoutController(options) {
	Node.call(this);

	this._options = {};
	this._idToNode = {};
	this._comp = this.addComponent({
		onUpdate: _layout.bind(this),
		onSizeChange: _layout.bind(this)
	});

	if (options) {
		if (options.visualFormat) {
			this.setVisualFormat(options.visualFormat);
		}
		if (options.layoutOptions) {
			this.setLayoutOptions(options.options);
		}
	}
}
AutoLayoutController.prototype = Object.create(Node.prototype);
AutoLayoutController.prototype.constructor = AutoLayoutController;

AutoLayoutController.DEFAULT_PARSE_OPTIONS = {
	extended: true,
	strict: false
};

function _setIntrinsicWidths(widths) {
    for (var key in widths) {
        var subView = this._autoLayoutView.subViews[key];
        var node = this._idToNode[key];
        if (subView && node) {
            subView.intrinsicWidth = node.getSize()[0];
        }
    }
}

function _setIntrinsicHeights(heights) {
    for (var key in heights) {
        var subView = this._autoLayoutView.subViews[key];
        var node = this._idToNode[key];
        if (subView && node) {
            subView.intrinsicHeight = node.getSize()[1];
        }
    }
}

function _setViewPortSize(size, vp) {
    size = [
        ((vp.width !== undefined) && (vp.width !== true)) ? vp.width : Math.max(Math.min(size[0], vp['max-width'] || size[0]), vp['min-width'] || 0),
        ((vp.height !== undefined) && (vp.height !== true)) ? vp.height : Math.max(Math.min(size[1], vp['max-height'] || size[1]), vp['min-height'] || 0)
    ];
    if ((vp.width === true) && (vp.height === true)) {
        size[0] = this._autoLayoutView.fittingWidth;
        size[1] = this._autoLayoutView.fittingHeight;
    }
    else if (vp.width === true) {
        this._autoLayoutView.setSize(undefined, size[1]);
        size[0] = this._autoLayoutView.fittingWidth;
        // TODO ASPECT RATIO?
    }
    else if (vp.height === true) {
        this._autoLayoutView.setSize(size[0], undefined);
        size[1] = this._autoLayoutView.fittingHeight;
        // TODO ASPECT RATIO?
    }
    else {
        size = vp['aspect-ratio'] ? [
            Math.min(size[0], size[1] * vp['aspect-ratio']),
            Math.min(size[1], size[0] / vp['aspect-ratio'])
        ] : size;
        this._autoLayoutView.setSize(size[0], size[1]);
    }
    return size;
}

function _layout() {
	if (!this._autoLayoutView) {
		return;
	}
    console.log('layout');
    var x;
    var y;
    var size = this.getSize();
    if (this._options.spacing || this._metaInfo.spacing) {
		this._autoLayoutView.setSpacing(this._options.spacing || this._metaInfo.spacing);
    }
    var widths = this._options.widths || this._metaInfo.widths;
    if (widths) {
        _setIntrinsicWidths.call(this, widths);
    }
    var heights = this._options.heights || this._metaInfo.heights;
    if (heights) {
        _setIntrinsicHeights.call(this, heights);
    }
    if (this._options.viewport || this._metaInfo.viewport) {
		var restrainedSize = _setViewPortSize.call(this, size, this._options.viewport || this._metaInfo.viewport);
		x = (size[0] - restrainedSize[0]) / 2;
		y = (size[1] - restrainedSize[1]) / 2;
    }
    else {
		this._autoLayoutView.setSize(size[0], size[1]);
		x = 0;
		y = 0;
    }
    for (var key in this._autoLayoutView.subViews) {
        var subView = this._autoLayoutView.subViews[key];
        if ((key.indexOf('_') !== 0) && (subView.type !== 'stack')) {
			var node = this._idToNode[key];
			if (node) {
                node.setSizeMode(
                    (widths && (widths[key] === true)) ? undefined : Node.ABSOLUTE_SIZE,
                    (heights && (heights[key] === true)) ? undefined : Node.ABSOLUTE_SIZE
                );
				node.setAbsoluteSize(
                    (widths && (widths[key] === true)) ? undefined : subView.width,
                    (heights && (heights[key] === true)) ? undefined : subView.height
                );
				node.setPosition(
                    x + subView.left,
                    y + subView.top,
                    subView.zIndex * 5
                );
			}
        }
    }
    if (this._reflowLayout) {
        this._reflowLayout = false;
        this.requestUpdate(this._comp);
    }
}

/**
 * Forces a reflow of the layout.
 *
 * @return {AutoLayoutController} this
 */
AutoLayoutController.prototype.reflowLayout = function() {
    if (!this._reflowLayout) {
        this._reflowLayout = true;
        this.requestUpdate(this._comp);
    }
};

/**
 * Sets the visual-format string.
 *
 * @param {String|Array} visualFormat String or array of strings containing VFL.
 * @param {Object} [parseOptions] Specify to override the parse options for the VFL.
 * @return {AutoLayoutController} this
 */
AutoLayoutController.prototype.setVisualFormat = function(visualFormat, parseOptions) {
	this._visualFormat = visualFormat;
	var constraints = AutoLayout.VisualFormat.parse(visualFormat, parseOptions || AutoLayoutController.DEFAULT_PARSE_OPTIONS);
	this._metaInfo = AutoLayout.VisualFormat.parseMetaInfo(visualFormat);
	this._autoLayoutView = new AutoLayout.View({
		constraints: constraints
	});
	this.reflowLayout();
	return this;
};

/**
 * Sets the options such as viewport, spacing, etc...
 *
 * @param {Object} options Layout-options to set.
 * @return {AutoLayoutController} this
 */
AutoLayoutController.prototype.setLayoutOptions = function(options) {
	this._options = options || {};
	this.reflowLayout();
	return this;
};

/**
 * Adds a new child to this node. If this method is called with no argument it will
 * create a new node, however it can also be called with an existing node which it will
 * append to the node that this method is being called on. Returns the new or passed in node.
 *
 * @param {Node|void} child The node to appended or no node to create a new node.
 * @param {String} id Unique id of the node which matches the id used in the Visual format.
 * @return {Node} the appended node.
 */
AutoLayoutController.prototype.addChild = function(child, id) {
	child = Node.prototype.addChild.call(this, child);
	this._idToNode[id] = child;
	this.reflowLayout();
	return child;
};

/**
 * Removes a child node from another node. The passed in node must be
 * a child of the node that this method is called upon.
 *
 * @param {Node} [child] node to be removed
 * @param {String} [id] Unique id of the node which matches the id used in the Visual format.
 * @return {Boolean} whether or not the node was successfully removed
 */
AutoLayoutController.prototype.removeChild = function(child, id) {
	var res = false;
	if (child && id) {
		res = Node.prototype.removeChild.call(this, child);
		delete this._idToNode[id];
	}
	else if (child) {
		for (id in this._idToNode) {
			if (this._idToNode[id] === child) {
				delete this._idToNode[id];
				break;
			}
		}
		res = Node.prototype.removeChild.call(this, child);
	}
	else if (id) {
		res = Node.prototype.removeChild.call(this, this._idToNode[id]);
		delete this._idToNode[id];
	}
	this.reflowLayout();
	return res;
};

module.exports = AutoLayoutController;
