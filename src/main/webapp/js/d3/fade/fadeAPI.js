/* global d3 */

/**
 * Demonstration D3 graph with an encapsulated API. Also demonstrates
 * the use of dispatching events for loose coupling
 * 
 * PUBLIC API
 * doHide(boolean) hide or display the graph
 * reDraw(newData) redraw the graph
 * 
 * PUBLIC Constructor
 * init(data) create the public API
 * 
 */

d3.fadeAPI = {};


/**
 * The initiation method or constructor if you will.
 * The parameter passed in conditions initialization parameters
 * 
 * 
 * var margin = {top: 5, right: 40, bottom: 50, left: 60};
 * 
 * var initConditions =
 {
 "margin": margin,
 "width": width,
 "height": height,
 "delay": 500,
 "data": getSampleData(MAX_POINTS),
 "attachmentID": "graph"
 };
 * 
 *  This returns a function object that contains the public API
 * @param {type} initConditions
 * @returns {d3.fadeAPI.init.exports}
 */
d3.fadeAPI.init = function (initConditions)
{

    var keyFunction = function (d) {
        return d.index;
    };


    var getXScale = function ()
    {
        return d3.time.scale().range([0, width]);
    };

    var getYScale = function ()
    {
        return d3.scale.linear().range([height, 0]);
    };


    var formatTimeFunction = d3.time.format("%_m/%_d");
    var dateFormatter = d3.time.format("%Y-%m-%d");
    var parseDate = dateFormatter.parse;
    /**
     * 
     * will give the left side of the date array of the axis
     */
    var bisectDate = d3.bisector(function (d) {
        return d.date;
    }).left;

    var margin = initConditions.margin;
    var width = initConditions.width;
    var height = initConditions.height;
    var delay = initConditions.delay;


    var groupNode = initConditions.groupNode;
    var xScale = getXScale();
    var yScale = getYScale();
    var xAxis = null;
    var yAxis = null;
    var attachmentID = initConditions.attachmentID;
    var isLoading = false;
    //define an onLoad event, multiple events are comma delimited list
    var dispatch = d3.dispatch("onLoad", "newSelection");
    var selectedPoint = {"dataItem": null, "svgItem": null};
    var verticalBar = null;
    var data = initConditions.data;
    //var dotColor = "blue";
    var divT = null; //the tooltip div
    var indicator = null;


    /**
     * 
     * initialization
     */
    var initializeSVG = function ()
    {


        divT = d3.select("#" + attachmentID).append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

        var svg = d3.select("svg");
        var attachPoint = svg.append('g').attr("class", "indicatorAttachPoint");

       
        indicator = d3.indicator.init({"attachmentGroup": attachPoint});
        

        attachPoint.attr("transform", "translate(" +
                (width +margin.left+margin.right - indicator.getSizeAttributes().width) / 2 + ","
                + (height +margin.top +margin.bottom - indicator.getSizeAttributes().height) / 2 + ")");




//        this centers  rectangle when attached to the body
//        console.log("ctm "+ctm);
//        var ctm = svg[0][0].getScreenCTM();
//        var hh = $('<span>').appendTo('body');
//        hh.css(
//                {"border":"thin solid green",
//                 "position":"absolute",
//                 "width":width+margin.right,
//                 "height":height,
//                 "class": "bonzo",
//                 "top": ctm.f,
//                 "left": ctm.e  
//        
//                }
//                );
    };


    initializeSVG();

    /**
     * 
     * 
     * inline function used to draw the lines
     */
    var valueline = d3.svg.line()
            .x(function (d) {
                return  xScale(d.date);
            })
            .y(function (d) {
                return  yScale(d.data);
            });



    /**
     * this function will take a pixel value and translate into a date on
     * the axis
     * @param {type} pixelValue
     * @returns  {newTarget: the data item , circleIdx: the index in the
     * data set for that item}
     */
    var findDateForPixel = function (pixelValue)
    {
        //given x pos of mouse use xScale to turn that into a bisector

        var x0 = xScale.invert(pixelValue);
        var i = bisectDate(data, x0, 1);
        var d0 = data[i - 1];
        var d1 = data[i];
        var ret = {"newTarget": null, "circleIdx": -1};

        if (x0 - d0.date > d1.date - x0)
        {
            ret.newTarget = d1;
            ret.circleIdx = i;
        }
        else
        {
            ret.newTarget = d0;
            ret.circleIdx = i - 1;
        }

        return ret;
    }


    /**
     * 
     * @returns {undefined}mouse move routine
     */
    var mouseMove = function ()
    {

        if (isLoading === true)
        {
            //ignore mouse while loading
            return;
        }
        var mousePtX = d3.mouse(this)[0];
        var mousePtY = d3.mouse(this)[1];
        var ret = findDateForPixel(mousePtX);
        var pointDataArray = d3.selectAll(".dot");

        if (selectedPoint.dataItem === null ||
                (selectedPoint.dataItem.date !== ret.newTarget.date))
        {
            //only raise event if you actually change
            selectedPoint.dataItem = ret.newTarget;
            // find the circle
            //d3.select(svgItem) is the same as $(htmlElement) in jQuery
            selectedPoint.svgItem = d3.select(pointDataArray[0][ret.circleIdx]);
            //raise a newSelection event, with the payload
            dispatch.newSelection.apply(this, [ret.newTarget, ret.newTarget.index + 1]);

            //tooltip show
            divT.transition()
                    .duration(delay)
                    .style("opacity", .9);
            divT.html(dateFormatter(selectedPoint.dataItem.date)
                    + "<br/>" + selectedPoint.dataItem.data)
                    .style("left", (mousePtX + 35) + "px")
                    .style("top", (yScale(selectedPoint.dataItem.data) - 35) + "px");



        }
        //start drawing the grey line
        var yStart = yScale(ret.newTarget.data);
        var yLength = (yScale(height) - yStart) + margin.bottom / 4;

        var xBar = xScale(ret.newTarget.date);

        //focus is the encircling circle highlighting the points
        focus.select("circle.focusCircle")
                .attr("transform",
                        "translate(" + xScale(ret.newTarget.date) + "," +
                        yScale(ret.newTarget.data) + ")");


        verticalBar.select("rect.verticalBar")
                .attr('width', 2)
                .attr('height', yLength)
                .attr('x', xBar)
                .attr('y', yStart)
                .style("display", "block")
                .style('pointer-events', 'none');

    };

    var sizeXAxis = function ()
    {
        xAxis =
                d3.svg.axis()
                .scale(xScale).tickPadding(15)
                .ticks(8)
                .tickFormat(function (d) {
                    //return d3.time.format("%Y-%m-%d")
                    return  formatTimeFunction(d);
                })
                .innerTickSize([4])
                .outerTickSize([20])
                .orient("bottom");
    }
    /**
     * 
     * @returns {undefined}build the axes of the graph
     */
    var assembleAxes = function ()
    {
        xScale.domain(d3.extent(data, function (d) {
            return d.date;
        }));
        yScale.domain([0, d3.max(data, function (d) {
                return d.data;
            })]);


        sizeXAxis();


        yAxis = d3.svg.axis().scale(yScale)
                .orient("left").ticks(5);

        groupNode.append("g")
                .attr("class", "x axis")

                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

        // Add the Y Axis
        groupNode.append("g")
                .attr("class", "y axis")
                .call(yAxis);
    };




    /**
     * 
     * @returns {undefined}
     * draw the points on the graph
     */

    var doDots = function ()
    {

        var dots = groupNode.selectAll(".dot").data(data, keyFunction);

        dots.enter().append("circle")
                // .attr("fill", dotColor)
                .attr("r", 5)
                .attr("class", "dot")
                .attr("cx", function (d) {
                    return xScale(d.date);
                })
                .attr("cy", function (d) {
                    return yScale(d.data);
                })



        dots.attr("r", 5)
                .attr("cx", function (d) {
                    return xScale(d.date);
                })
                .attr("cy", function (d) {
                    return yScale(d.data);
                });

        // delete
        dots.exit().remove();
        //update



    };

    /**
     * 
     * @returns {undefined}
     * redraw after thing AFTER initialization
     */
    var reBuild = function () {

        divT.style("display", "none");

        selectedPoint = {"dataItem": null, "svgItem": null};
        xScale.domain(d3.extent(data, function (d) {
            return d.date;
        }));
        yScale.domain([0, d3.max(data, function (d) {
                return d.data;
            })]);


        //lines
        groupNode.select(".line")   // change the line
                .attr("d", valueline(data));
        groupNode.select(".x.axis") // change the x axis
                .call(xAxis);
        groupNode.select(".y.axis") // change the y axis
                .call(yAxis);

        //dots        
        doDots();




    };

    /**
     * 
     * @returns {undefined}
     * draw things for the first time
     */
    var initialDraw = function ()
    {


        groupNode.append("path")
                .attr("class", "line")
                .attr("d", valueline(data));

        doDots();

    };

    /**
     * define the highlighting circle
     */
    var focus = groupNode.append("g").style("display", "none");

    focus.append("circle")
            .attr("class", "focusCircle")
            .style("fill", "none")
            .style("stroke", "darkRed")
            .attr("r", 14);
    verticalBar = groupNode.append("g").style("display", "none");
    verticalBar.append("rect").attr('class', 'verticalBar');




    // do the inital display
    assembleAxes();
    initialDraw();
    // the mouse detection rectangle  positioned here to be on top of the points

    groupNode.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "mouseRect")
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function () {
                focus.style("display", null);
                verticalBar.style("display", null);
                divT.style("display", "block");

            })
            .on("mouseout", function () {
                focus.style("display", "none");
                verticalBar.style("display", "none");
                divT.style("display", "none");
            })
            .on("mousemove", mouseMove);

/////////// PUBLIC API//////////////////////////////////////////////
    function exports()
    {

    }
    ;


    /**
     * resize the graph along the xaxis
     * @param {type} newWidth
     * @returns {undefined}reoutine to resize the graph
     */
    exports.reSizeGraph = function (newWidth)
    {
        width = newWidth;
        xScale = getXScale();
        xScale.domain(d3.extent(data, function (d) {
            return d.date;
        }));
        divT.style("display", "none");
        d3.selectAll(".mouseRect").attr("width", newWidth);
        sizeXAxis();
        reBuild();
    }


    /**
     * Routine for redrawing the graph takes new data
     * 
     * @param {type} newData
     * @returns {undefined}
     */
    exports.reDraw = function (newData)
    {

        data = newData;
        reBuild();

    };

    exports.getData = function ()
    {
        return data;
    }

    exports.getXScale = function ()
    {
        return xScale;
    };






    /**
     * if doHide is true then this will fade the graph out after a delay
     * it also sends a onLoad event with payload of Load Start  
     * 
     * if false, then it brings the graph back up and the onLoad event 
     * is Load End
     * 
     * @param {boolean} doHide true or false
     * @returns {void}
     */
    exports.hide = function (doHide)
    {

       
        divT.style("display", "none");

       
        isLoading = doHide;
        indicator.show(isLoading);
        var opacityStr = "1";
        if (isLoading)
        {
            opacityStr = "0";
            //raise onLoadEvent --Start
            dispatch.onLoad.apply(groupNode, [{"type": "Load Start"}]);
        }
        groupNode.transition().delay(200).each("end", function (d, i)
        {
           

            if (isLoading)
            {
                
            }
            else
            {
                  dispatch.onLoad.apply(this, [{"type": "Load End"}]);

            }
        }).style("opacity", opacityStr);

    };
    //set up routing of 'exports.on' to 'dispatch.on'
    d3.rebind(exports, dispatch, "on");
    //expose the public api
    return exports;

};







 