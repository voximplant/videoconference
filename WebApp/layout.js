(function($) {
    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
            if(opt.handle === "") {
                var $drag = $(this).addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });

    }
})(jQuery);

function updateGrid(container, calls) {
	try {	
			calls_num = calls.length;
			$(container).children().hide();

			var fWindowProportion = ( $(container).height() - 50 )/ $(container).width();

			var Width = $(container).width();

			//var Height:int = grid_canvas.height;
			var Height = $(container).height() - 50;

			var RowCount, ColCount, gW, gH, gL, gT;
			
			var BestSquare = 0;
			var BestRows, BestCols, BestHeight, BestWidth;
			var Rows = 1;
			var Cols = calls_num;
			BestRows = BestCols = BestHeight = BestWidth = 0;
			
			if (calls_num == 0)
			{
				console.log("No streams to display");
				return;
			}
			while (true) {
				console.log("updateGrid cycle");
				var GridWidth, GridHeight;
				
				var cw = Width / Cols;
				var ch = Height / Rows;
				var proportion = ch > 0? ch / cw: 0;	
			
				if (proportion > fWindowProportion) {
					GridWidth = Width;
					GridHeight = Width / Cols;	
					GridHeight = GridHeight > Height ? Height: GridHeight;
				}
				else {
					GridHeight = Height;
					GridWidth = ( Height / Rows ) * Cols / fWindowProportion;
					GridWidth = GridWidth > Width ? Width : GridWidth;
				}
				
				var GridSquare = GridHeight * GridWidth;
				GridSquare = GridSquare * (calls_num / (Rows * Cols));
				
				if (GridSquare > BestSquare) {
					BestSquare = GridSquare;
	                BestRows = Rows;
	                BestCols = Cols;
	                BestHeight = GridHeight;
	                BestWidth = GridWidth;
				}
				
				if (Cols == 1)
	                break;
	                
	            Rows++;
	            Cols = calls_num / Rows;
	            if (Cols * Rows < calls_num)
	                Cols++;
			}
			
	        var indentX = (Width - BestWidth) / 2,
	        	indentY = (Height - BestHeight) / 2;

	        gW = BestWidth;
	        gH = BestHeight;
	        RowCount = Math.ceil(BestRows);
	        ColCount = Math.ceil(BestCols);
	        
	        var current_row = 1;
	        var current_col = 1;
	        for (var t in calls) {

	        	if (typeof calls[t].call.getVideoElementId == "function") {
					var vs = document.getElementById(calls[t].call.getVideoElementId());
				} else {
					vs = $('#'+calls[t].call.number()).children('.pstnImage')[0];
				}

					if(current_row == 1) $(vs).parent()[0].style.top = 50 + 'px';
					else $(vs).parent()[0].style.top = 50 + (current_row - 1) * gH/RowCount + 'px';
					if(current_col == 1) $(vs).parent()[0].style.left = 0 + 'px'; 
					else {
						$(vs).parent()[0].style.left = (current_col - 1) * gW/ColCount + 'px';
					}

					$(vs).width(gW/ColCount - 2);
					$(vs).height(gH/RowCount - 2);

					$(vs).parent().width(gW/ColCount - 2);
					$(vs).parent().height(gH/RowCount - 2);
					if (current_col == ColCount) {current_col = 1; current_row++; }
					else current_col++; 
					$(vs).parent()[0].style.left = parseFloat($(vs).parent()[0].style.left) + indentX + 'px';
					$(vs).parent()[0].style.top = parseFloat($(vs).parent()[0].style.top) + indentY + 'px';
					$(vs).parent().show();

	        }
		}
		catch (myError) { 
			console.log("updateGrid exception: "+myError); 
		} 
}