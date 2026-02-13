export const buildCategoryTree = (rows) => {
  const map = {};
  const roots = [];

  // 1️⃣ create map
  rows.forEach((row) => {
    map[row.category_id] = { ...row, children: [] };
  });

  // 2️⃣ build tree
  rows.forEach((row) => {
    if (row.parent_id && map[row.parent_id]) {
      map[row.parent_id].children.push(map[row.category_id]);
    } else {
      roots.push(map[row.category_id]);
    }
  });

  return roots;
};

export const countTreeNodes = (nodes = []) => {
  let count = 0;

  const traverse = (arr) => {
    for (const node of arr) {
      count++;
      if (node.children && node.children.length) {
        traverse(node.children);
      }
    }
  };

  traverse(nodes);
  return count;
};

// export default { buildCategoryTree, countTreeNodes };
