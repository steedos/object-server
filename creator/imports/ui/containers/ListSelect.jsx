

function ListSelect(cellData, options){
	let items = cellData && cellData.length && cellData[0].items;
	return (
		<React.Fragment>
			{items.map((item)=>{
				let className = `creator-cell-color-${options.object_name}-${options.field.name} creator-cell-color-${options.object_name}-${options.field.name}-${item.value}`;
				if(options.field.multiple){
					className += " creator-cell-multiple-color"
				}
				return (<span title={`${item.label}`} className={className}>
					{item.label}
				</span>)
			})}
		</React.Fragment>
	);
}

export default ListSelect