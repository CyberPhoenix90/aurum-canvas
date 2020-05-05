Aurum style scene graph management for rendering in canvas
Depends on aurum.js

Allows creating canvas drawings using familar concepts from Aurum.js
Supports data sources for all attributes and dynamic scene graphs with array data sources

```
<AurumCanvas width="200" height="200">
	<AurumRectangle x={a} y={20} fillColor="red" width={20} heigth={20}>
		<AurumRectangle x={20} y={a} fillColor="blue" width={20} heigth={20}></AurumRectangle>
	</AurumRectangle>
	<AurumRectangle x={50} y={50} fillColor="green" width={20} heigth={20}></AurumRectangle>
	<AurumText x={10} y={10} fillColor="black">
		{name}
	</AurumText>
</AurumCanvas>

```